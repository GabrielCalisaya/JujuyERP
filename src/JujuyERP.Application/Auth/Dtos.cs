namespace JujuyERP.Application.Auth;

/// <summary>
/// DTO de entrada para el registro de un nuevo comercio (tenant) y su usuario administrador.
/// Un solo endpoint hace ambas cosas: crea la empresa y el primer usuario Admin en una
/// transacción atómica, garantizando que nunca exista un Tenant sin usuario dueño.
/// </summary>
public record RegistrarTenantDto(
    // ── Datos del Comercio ──────────────────────────────────────────────────
    string NombreEmpresa,
    string RucCuit,

    // ── Datos del Usuario Administrador ─────────────────────────────────────
    string AdminNombre,
    string AdminEmail,
    string AdminPassword
);

/// <summary>
/// DTO de entrada para el login. Usamos email como identificador único
/// porque es más fácil de recordar que un username arbitrario y ya
/// fue validado como único en el registro.
/// </summary>
public record LoginDto(
    string Email,
    string Password
);

/// <summary>
/// DTO de respuesta de autenticación.
/// Incluye el token JWT y datos mínimos del usuario para que el cliente
/// pueda personalizar la UI sin necesidad de una segunda petición.
/// ExpiresAt permite al cliente PWA gestionar el refresco del token offline.
/// </summary>
public record AuthResponseDto(
    string Token,
    DateTime ExpiresAt,
    Guid UsuarioId,
    string Nombre,
    string Email,
    string Rol,
    Guid TenantId,
    string NombreEmpresa
);
