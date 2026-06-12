using JujuyERP.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JujuyERP.Infrastructure.Persistence.Configurations;

/// <summary>
/// Configuración de Fluent API para la entidad Tenant.
///
/// DECISIÓN DE ARQUITECTURA: Usamos IEntityTypeConfiguration<T> en lugar de
/// Data Annotations en el Domain para mantener la capa de dominio libre de
/// dependencias de infraestructura (EF Core). El dominio solo define el modelo
/// de negocio; las restricciones de la BD se definen aquí.
/// </summary>
public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.ToTable("Tenants");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.NombreEmpresa)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(t => t.RucCuit)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(t => t.RucCuit)
            .IsUnique();

        builder.Property(t => t.PlanActivo)
            .HasConversion<string>()
            .HasMaxLength(20);

        // TEXT es el tipo nativo de SQLite para cadenas largas (equivalente a NVARCHAR(MAX))
        builder.Property(t => t.ModulosActivosConfig)
            .HasDefaultValue("{}");

        builder.Property(t => t.FechaRegistro)
            .HasDefaultValueSql("datetime('now')");

        builder.HasMany(t => t.Productos)
            .WithOne(p => p.Tenant)
            .HasForeignKey(p => p.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
