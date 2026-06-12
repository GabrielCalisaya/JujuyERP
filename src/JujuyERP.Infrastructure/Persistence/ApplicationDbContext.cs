using System.Reflection;
using JujuyERP.Application.Common.Interfaces;
using JujuyERP.Domain.Common;
using JujuyERP.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace JujuyERP.Infrastructure.Persistence;

/// <summary>
/// DbContext central de la aplicación. Implementa tres responsabilidades críticas:
///
/// 1. MULTI-TENANCY TRANSPARENTE: Aplica Global Query Filters automáticamente a
///    todas las entidades que implementen IMustHaveTenant. El desarrollador nunca
///    necesita escribir ".Where(x => x.TenantId == currentTenantId)" manualmente.
///
/// 2. INYECCIÓN AUTOMÁTICA DE TenantId: Intercepta SaveChanges para asignar el
///    TenantId del contexto actual a las nuevas entidades antes de persistirlas.
///
/// 3. AUDITORÍA AUTOMÁTICA: Asigna FechaCreacion/FechaModificacion en cada save,
///    eliminando la responsabilidad de los controladores y comandos CQRS.
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
        // Carga automáticamente todas las clases IEntityTypeConfiguration<T>
        // del assembly de Infrastructure. Al agregar nuevas entidades, solo
        // creas su Configuration; no necesitas modificar este método.
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // ── GLOBAL QUERY FILTERS ─────────────────────────────────────────────
        // Iteramos sobre todos los tipos de entidad del modelo y aplicamos
        // el filtro de tenant SOLO a las que implementan IMustHaveTenant.
        // Esto es seguro, extensible y no rompe si se agrega un nuevo módulo.
        ApplyGlobalTenantFilters(modelBuilder);

        base.OnModelCreating(modelBuilder);
    }

    /// <summary>
    /// Aplica HasQueryFilter dinámicamente a cada entidad que implemente IMustHaveTenant.
    /// DECISIÓN: Usamos reflexión con expresiones lambda compiladas para construir el
    /// filtro en tiempo de inicialización. El costo de reflexión se paga UNA sola vez
    /// al arrancar la app (EF Core cachea el modelo), no en cada consulta.
    /// </summary>
    private void ApplyGlobalTenantFilters(ModelBuilder modelBuilder)
    {
        var tenantInterface = typeof(IMustHaveTenant);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (!tenantInterface.IsAssignableFrom(entityType.ClrType))
                continue;

            // Construimos: e => e.TenantId == _tenantProvider.TryGetTenantId()
            // Usamos el método de extensión genérico definido abajo.
            modelBuilder.SetTenantFilter(entityType.ClrType, _tenantProvider);
        }
    }

    // ── INTERCEPCIÓN DE SaveChanges ──────────────────────────────────────────

    /// <summary>
    /// Antes de persistir, inyecta automáticamente:
    /// - TenantId a entidades nuevas que implementen IMustHaveTenant
    /// - Timestamps de auditoría a entidades que extiendan AuditableEntity
    ///
    /// DECISIÓN: Centralizar esta lógica aquí garantiza que NUNCA se escape
    /// un registro sin TenantId, independientemente de qué capa cree la entidad.
    /// Es la "última línea de defensa" del aislamiento multi-tenant.
    /// </summary>
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var utcNow = DateTime.UtcNow;
        var currentTenantId = _tenantProvider.TryGetTenantId();

        foreach (var entry in ChangeTracker.Entries())
        {
            // ── Inyección de TenantId ────────────────────────────────────────
            if (entry.Entity is IMustHaveTenant tenantEntity
                && entry.State == EntityState.Added)
            {
                if (tenantEntity.TenantId == Guid.Empty)
                {
                    if (!currentTenantId.HasValue)
                        throw new InvalidOperationException(
                            $"No se puede persistir '{entry.Entity.GetType().Name}' sin un TenantId válido. " +
                            "Asegúrese de que la solicitud esté autenticada con un token JWT válido.");

                    tenantEntity.TenantId = currentTenantId.Value;
                }
            }

            // ── Auditoría automática ─────────────────────────────────────────
            if (entry.Entity is AuditableEntity auditable)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        auditable.FechaCreacion = utcNow;
                        break;

                    case EntityState.Modified:
                        auditable.FechaModificacion = utcNow;
                        // Evitamos que EF Core marque FechaCreacion como modified
                        entry.Property(nameof(AuditableEntity.FechaCreacion)).IsModified = false;
                        break;
                }
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Sobrecarga síncrona para mantener consistencia si alguien usa SaveChanges().
    /// En una app async-first como esta, siempre preferir SaveChangesAsync.
    /// </summary>
    public override int SaveChanges()
        => SaveChangesAsync().GetAwaiter().GetResult();
}
