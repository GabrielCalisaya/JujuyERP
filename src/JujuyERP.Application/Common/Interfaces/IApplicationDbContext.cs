using JujuyERP.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace JujuyERP.Application.Common.Interfaces;

/// <summary>
/// Abstracción del DbContext expuesta hacia la capa Application.
///
/// DECISIÓN DE ARQUITECTURA: Application no referencia directamente EF Core.
/// En su lugar, define un contrato (esta interfaz) que Infrastructure implementa.
/// Esto cumple la Regla de Dependencia de Clean Architecture: el núcleo no
/// depende de frameworks. Si mañana cambiamos de EF Core a Dapper, solo
/// cambia Infrastructure; Application y Domain permanecen intactos.
/// </summary>
public interface IApplicationDbContext
{
    DbSet<Tenant> Tenants { get; }
    DbSet<Producto> Productos { get; }
    DbSet<Usuario> Usuarios { get; }
    DbSet<Venta> Ventas { get; }
    DbSet<VentaDetalle> VentaDetalles { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
