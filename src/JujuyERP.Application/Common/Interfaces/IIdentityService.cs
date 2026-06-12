using JujuyERP.Application.Auth;

namespace JujuyERP.Application.Common.Interfaces;

/// <summary>
/// Contrato del servicio de identidad.
///
/// DECISIÓN DE ARQUITECTURA: Esta interfaz vive en Application y su implementación
/// en Infrastructure, siguiendo la Regla de Dependencia. Esto permite:
///   - Testear los controladores inyectando un IIdentityService mock.
///   - Cambiar la estrategia de autenticación (JWT → OAuth, FIDO2, etc.)
///     sin tocar nada fuera de Infrastructure.
///
/// Retornamos Result<T> implícito mediante excepciones tipadas por ahora.
/// En una versión más madura, usar el patrón Result<T, Error> para evitar
/// el uso de excepciones como control de flujo.
/// </summary>
public interface IIdentityService
{
    /// <summary>
    /// Registra un nuevo Tenant y crea su usuario Administrador inicial.
    /// La operación es transaccional: si la creación del usuario falla,
    /// el Tenant NO queda persistido.
    /// </summary>
    /// <exception cref="InvalidOperationException">Si el email o RUC/CUIT ya existe.</exception>
    Task<AuthResponseDto> RegistrarTenantAsync(
        RegistrarTenantDto dto,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Autentica un usuario por email y contraseña.
    /// </summary>
    /// <exception cref="UnauthorizedAccessException">Si las credenciales son inválidas.</exception>
    Task<AuthResponseDto> LoginAsync(
        LoginDto dto,
        CancellationToken cancellationToken = default);
}
