using System.Reflection;
using JujuyERP.Application.Common.Interfaces;
using JujuyERP.Domain.Common;
using JujuyERP.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace JujuyERP.Infrastructure.Persistence;

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
    public DbSet<Venta> Ventas => Set<Venta>();
    public DbSet<VentaDetalle> VentaDetalles => Set<VentaDetalle>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        ApplyGlobalTenantFilters(modelBuilder);
        base.OnModelCreating(modelBuilder);
    }

    private void ApplyGlobalTenantFilters(ModelBuilder modelBuilder)
    {
        var tenantInterface = typeof(IMustHaveTenant);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (!tenantInterface.IsAssignableFrom(entityType.ClrType))
                continue;

            typeof(ApplicationDbContext)
                .GetMethod(nameof(ApplyTenantFilterForEntity),
                           BindingFlags.NonPublic | BindingFlags.Instance)!
                .MakeGenericMethod(entityType.ClrType)
                .Invoke(this, [modelBuilder]);
        }
    }

    private void ApplyTenantFilterForEntity<T>(ModelBuilder modelBuilder)
        where T : class, IMustHaveTenant
    {
        modelBuilder.Entity<T>().HasQueryFilter(e =>
            !HasActiveTenantFilter || e.TenantId == ActiveTenantId);
    }

    private bool HasActiveTenantFilter => _tenantProvider.TryGetTenantId().HasValue;

    private Guid ActiveTenantId => _tenantProvider.TryGetTenantId() ?? Guid.Empty;

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
