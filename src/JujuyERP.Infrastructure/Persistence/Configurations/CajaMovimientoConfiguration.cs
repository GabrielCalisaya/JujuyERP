using JujuyERP.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JujuyERP.Infrastructure.Persistence.Configurations;

public class CajaMovimientoConfiguration : IEntityTypeConfiguration<CajaMovimiento>
{
    public void Configure(EntityTypeBuilder<CajaMovimiento> builder)
    {
        builder.ToTable("CajaMovimientos");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Tipo).HasMaxLength(20).IsRequired();
        builder.Property(c => c.MetodoPago).HasMaxLength(30).IsRequired();
        builder.Property(c => c.Monto).HasPrecision(18, 4).IsRequired();
        builder.Property(c => c.Concepto).HasMaxLength(300);
    }
}
