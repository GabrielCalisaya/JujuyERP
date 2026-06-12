using System.Security.Claims;
using JujuyERP.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace JujuyERP.Infrastructure.Services;

/// <summary>
/// Implementación concreta de ITenantProvider que extrae el TenantId
/// desde los Claims del JWT del usuario autenticado.
///
/// DECISIÓN DE ARQUITECTURA: Esta implementación vive en Infrastructure
/// (no en WebAPI) porque acceder al HttpContext es un detalle de infraestructura.
/// Application solo conoce el contrato ITenantProvider. Este diseño permite:
///   - Testing: reemplazar con un TenantProviderFake que devuelva un Guid fijo.
///   - Background jobs: reemplazar con un TenantProviderFromJobContext.
///   - Integrations: reemplazar con TenantProviderFromApiKey para integraciones B2B.
///
/// CLAIM UTILIZADO: "tenant_id" (claim personalizado en el JWT).
/// Al generar el token, el AuthService debe incluir este claim. Veremos su
/// implementación en el módulo de Autenticación.
/// </summary>
public class TenantProvider : ITenantProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    // Nombre del claim donde se almacena el TenantId en el JWT.
    // Definido como constante para evitar magic strings distribuidos por el código.
    public const string TenantIdClaimType = "tenant_id";

    public TenantProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    /// <inheritdoc/>
    public Guid GetTenantId()
    {
        var tenantId = TryGetTenantId();

        if (!tenantId.HasValue)
            throw new UnauthorizedAccessException(
                "El token JWT no contiene el claim 'tenant_id'. " +
                "Asegúrese de estar autenticado con un token válido emitido por este sistema.");

        return tenantId.Value;
    }

    /// <inheritdoc/>
    public Guid? TryGetTenantId()
    {
        var httpContext = _httpContextAccessor.HttpContext;

        // Si no hay contexto HTTP (background jobs, tests), retornamos null
        if (httpContext?.User?.Identity?.IsAuthenticated != true)
            return null;

        var tenantIdClaim = httpContext.User.FindFirst(TenantIdClaimType)
                         ?? httpContext.User.FindFirst(ClaimTypes.NameIdentifier + "_tenant");

        if (tenantIdClaim is null)
            return null;

        if (Guid.TryParse(tenantIdClaim.Value, out var tenantId))
            return tenantId;

        return null;
    }
}
