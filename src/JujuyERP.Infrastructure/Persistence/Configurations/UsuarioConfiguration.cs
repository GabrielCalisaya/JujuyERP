using JujuyERP.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JujuyERP.Infrastructure.Persistence.Configurations;

/// <summary>
/// Configuración de Fluent API para la entidad Usuario.
/// Define el esquema de la tabla de usuarios del sistema.
/// </summary>
public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("Usuarios");

        builder.HasKey(u => u.Id);

        // Email único por tenant: dos empresas distintas SÍ pueden tener el mismo
        // email (son universos aislados), pero dentro de un tenant el email es clave.
        builder.HasIndex(u => new { u.TenantId, u.Email })
            .IsUnique();

        builder.Property(u => u.Nombre)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(256);

        // BCrypt genera hashes de exactamente 60 caracteres.
        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasMaxLength(60);

        // Almacenamos el enum como string para legibilidad en la BD y compatibilidad
        // directa con los valores de Claim sin tabla de lookup adicional.
        builder.Property(u => u.Rol)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(u => u.Activo)
            .HasDefaultValue(true);
    }
}
