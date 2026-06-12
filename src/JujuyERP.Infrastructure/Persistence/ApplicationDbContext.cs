using System.Reflection;
using JujuyERP.Application.Common.Interfaces;
using JujuyERP.Domain.Common;
using JujuyERP.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace JujuyERP.Infrastructure.Persistence;

/// <summary>
/// DbContext central de la aplicación.
///
/// CORRECCIÓN DE ARQUITECTURA — Global Query Filters y captura de closure:
/// El modelo de EF Core se construye UNA sola vez y se cachea para toda la
/// vida de la aplicación. Las lambdas de HasQueryFilter se compilan con ese
/// modelo y se re-evalúan en cada query. Por eso es CRÍTICO que la lambda
/// capture 'this' (la instancia del DbContext del request actual), NO una
/// referencia externa al ITenantProvider.
///
/// INCORRECTO (bug de aislamiento):
///   static void Filter(ModelBuilder mb, ITenantProvider p)
///     => mb.Entity<T>().HasQueryFilter(e => e.TenantId == p.TryGetTenantId());
///   // 'p' queda congelado en la primera instancia creada.
///
/// CORRECTO:
///   private void FilterGeneric<T>(ModelBuilder mb)
///     => mb.Entity<T>().HasQueryFilter(e => e.TenantId == _tenantProvider.TryGetTenantId());
///   // '_tenantProvider' resuelve 'this' — y 'this' es Scoped, por lo que
///   // EF Core siempre lee el TenantId del usuario del request en curso.
/// </summary>
public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly ITenantProvider _tenantProvider;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ITenantProvider tenantProvider)
        : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        ApplyGlobalTenantFilters(modelBuilder);
        base.OnModelCreating(modelBuilder);
    }

    /// <summary>
    /// Itera los tipos del modelo y aplica HasQueryFilter a cada entidad
    /// que implemente IMustHaveTenant usando un método de INSTANCIA genérico.
    ///
    /// Al ser un método de instancia, la lambda resultante captura 'this'.
    /// EF Core re-evalúa 'this._tenantProvider.TryGetTenantId()' en cada query,
    /// usando la instancia Scoped del DbContext del request en curso.
    /// El costo de reflexión es O(número de entidades) y se paga solo al
    /// construir el modelo la primera vez (arranque de la app).
    /// </summary>
    private void ApplyGlobalTenantFilters(ModelBuilder modelBuilder)
    {
        var tenantInterface = typeof(IMustHaveTenant);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (!tenantInterface.IsAssignableFrom(entityType.ClrType))
                continue;

            // Invocamos el método de instancia genérico con el tipo concreto.
            // La lambda dentro de ese método captura 'this' automáticamente.
            typeof(ApplicationDbContext)
                .GetMethod(nameof(ApplyTenantFilterForEntity),
                           BindingFlags.NonPublic | BindingFlags.Instance)!
                .MakeGenericMethod(entityType.ClrType)
                .Invoke(this, [modelBuilder]);
        }
    }

    /// <summary>
    /// Registra el HasQueryFilter para la entidad T.
    /// La lambda '_tenantProvider.TryGetTenantId()' captura 'this' implícitamente
    /// (accede al campo privado de la instancia), lo cual es la clave del correcto
    /// aislamiento multi-tenant por request.
    /// </summary>
    private void ApplyTenantFilterForEntity<T>(ModelBuilder modelBuilder)
        where T : class, IMustHaveTenant
    {
        modelBuilder.Entity<T>().HasQueryFilter(e =>
            _tenantProvider.TryGetTenantId() == null
            || e.TenantId == _tenantProvider.TryGetTenantId()!.Value);
    }

    // ── Intercepción de SaveChanges ──────────────────────────────────────────

    /// <summary>
    /// Antes de persistir inyecta TenantId (si vacío) y timestamps de auditoría.
    /// </summary>
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var utcNow = DateTime.UtcNow;
        var currentTenantId = _tenantProvider.TryGetTenantId();

        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is IMustHaveTenant tenantEntity
                && entry.State == EntityState.Added
                && tenantEntity.TenantId == Guid.Empty)
            {
                if (!currentTenantId.HasValue)
                    throw new InvalidOperationException(
                        $"No se puede persistir '{entry.Entity.GetType().Name}' sin TenantId. " +
                        "La solicitud debe estar autenticada con un JWT válido.");

                tenantEntity.TenantId = currentTenantId.Value;
            }

            if (entry.Entity is AuditableEntity auditable)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        auditable.FechaCreacion = utcNow;
                        break;
                    case EntityState.Modified:
                        auditable.FechaModificacion = utcNow;
                        entry.Property(nameof(AuditableEntity.FechaCreacion)).IsModified = false;
                        break;
                }
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
        => SaveChangesAsync().GetAwaiter().GetResult();
}
