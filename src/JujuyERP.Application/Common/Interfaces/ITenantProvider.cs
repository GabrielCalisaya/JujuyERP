namespace JujuyERP.Application.Common.Interfaces;

/// <summary>
/// Contrato para obtener el TenantId del usuario autenticado en el contexto actual.
///
/// DECISIÓN DE ARQUITECTURA: Esta interfaz vive en Application (capa de contratos)
/// y su implementación concreta reside en Infrastructure o WebAPI (donde vive
/// IHttpContextAccessor). Application no sabe CÓMO se obtiene el TenantId
/// (podría venir de un JWT, un header, o una cookie); solo sabe que puede pedirlo.
/// Esto facilita el testing: en pruebas unitarias se inyecta un mock de esta
/// interfaz sin necesidad de simular un HttpContext real.
/// </summary>
public interface ITenantProvider
{
    /// <summary>
    /// Retorna el TenantId del usuario autenticado.
    /// Lanza <see cref="UnauthorizedAccessException"/> si el claim no está presente,
    /// lo cual indica un token inválido o una llamada no autenticada.
    /// </summary>
    Guid GetTenantId();

    /// <summary>
    /// Versión segura que retorna null si el TenantId no está disponible.
    /// Útil para endpoints públicos o de administración del sistema.
    /// </summary>
    Guid? TryGetTenantId();
}
