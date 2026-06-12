using JujuyERP.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JujuyERP.Infrastructure.Persistence.Configurations;

/// <summary>
/// Configuración de Fluent API para la entidad Producto.
/// Define constraints, índices y precisiones numéricas para datos financieros.
/// </summary>
public class ProductoConfiguration : IEntityTypeConfiguration<Producto>
{
    public void Configure(EntityTypeBuilder<Producto> builder)
    {
        builder.ToTable("Productos");

        builder.HasKey(p => p.Id);

        // Índice compuesto: un código de barras es único DENTRO de cada tenant,
        // pero dos tenants distintos pueden tener el mismo código EAN.
        // Sintaxis de filtro compatible con SQLite (sin corchetes de SQL Server).
        builder.HasIndex(p => new { p.TenantId, p.CodigoBarras })
            .IsUnique()
            .HasFilter("\"CodigoBarras\" IS NOT NULL");

        builder.Property(p => p.Nombre)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(p => p.CodigoBarras)
            .HasMaxLength(50);

        builder.Property(p => p.Descripcion)
            .HasMaxLength(1000);

        // precision(18,4): 18 dígitos totales, 4 decimales. Estándar para
        // montos financieros en ERP que manejan divisas y múltiplos de precios.
        builder.Property(p => p.PrecioVenta)
            .HasPrecision(18, 4);

        builder.Property(p => p.Costo)
            .HasPrecision(18, 4);

        builder.Property(p => p.StockActual)
            .HasPrecision(18, 4);

        builder.Property(p => p.StockMinimo)
            .HasPrecision(18, 4);

        builder.Property(p => p.Activo)
            .HasDefaultValue(true);
    }
}
