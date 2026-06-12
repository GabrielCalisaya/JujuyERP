using JujuyERP.Domain.Common;
using JujuyERP.Domain.Enums;

namespace JujuyERP.Domain.Entities;

/// <summary>
/// Representa un operador humano que accede al sistema.
///
/// DECISIÓN DE ARQUITECTURA:
/// - Implementa IMustHaveTenant: cada usuario pertenece a exactamente una empresa.
///   El Global Query Filter garantiza que un usuario nunca pueda acceder a datos
///   de otro tenant, ni siquiera si manipulara su propio JWT.
///
/// - PasswordHash almacena el resultado de BCrypt (o PBKDF2). NUNCA la contraseña
///   en texto plano. El hash incluye el salt internamente, por eso no hay campo Salt.
///
/// - No usamos ASP.NET Core Identity (IdentityUser) deliberadamente:
///   Identity agrega ~20 tablas y complejidad que no necesitamos en la fase inicial.
///   Nuestra implementación es más simple, trazable y portable a cualquier ORM.
/// </summary>
public class Usuario : AuditableEntity, IMustHaveTenant
{
    // ── Multi-tenancy ────────────────────────────────────────────────────────
    public Guid TenantId { get; set; }

    // ── Identidad ────────────────────────────────────────────────────────────
    public string Nombre { get; set; } = string.Empty;

    /// <summary>Email único dentro del tenant. Se usa como username para login.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Hash de la contraseña generado con BCrypt.
    /// Formato: $2a$11$[salt][hash] — 60 caracteres fijos.
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    public Rol Rol { get; set; } = Rol.Cajero;

    /// <summary>Soft-delete: el usuario inactivo no puede autenticarse.</summary>
    public bool Activo { get; set; } = true;

    // ── Navegación ───────────────────────────────────────────────────────────
    public Tenant? Tenant { get; set; }
}
