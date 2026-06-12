using System.Linq.Expressions;
using JujuyERP.Application.Common.Interfaces;
using JujuyERP.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace JujuyERP.Infrastructure.Persistence;

/// <summary>
/// Métodos de extensión para ModelBuilder que permiten aplicar Global Query Filters
/// de forma genérica y tipada, sin duplicar código por cada entidad multi-tenant.
/// </summary>
public static class ModelBuilderExtensions
{
    /// <summary>
    /// Aplica un HasQueryFilter dinámico a la entidad indicada por <paramref name="entityType"/>.
    ///
    /// CÓMO FUNCIONA:
    /// EF Core requiere que HasQueryFilter reciba una expresión lambda tipada: Expression{Func{T, bool}}.
    /// Como aquí trabajamos con tipos en tiempo de ejecución (no compile-time), usamos reflexión para
    /// invocar el método genérico SetTenantFilterGeneric{T} con el tipo correcto en tiempo de ejecución.
    ///
    /// El costo de esta reflexión se incurre UNA sola vez cuando EF Core construye el modelo
    /// (al arrancar la aplicación), NO en cada consulta SQL. Es completamente seguro en producción.
    /// </summary>
    public static void SetTenantFilter(
        this ModelBuilder modelBuilder,
        Type entityType,
        ITenantProvider tenantProvider)
    {
        // Obtenemos el método genérico y lo especializamos con el tipo concreto de la entidad
        var method = typeof(ModelBuilderExtensions)
            .GetMethod(nameof(SetTenantFilterGeneric), System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static)!
            .MakeGenericMethod(entityType);

        method.Invoke(null, [modelBuilder, tenantProvider]);
    }

    /// <summary>
    /// Versión genérica tipada. Construye la expresión lambda:
    ///     e => e.TenantId == tenantProvider.TryGetTenantId()
    ///
    /// La lambda captura el ITenantProvider por referencia, lo que significa que
    /// EF Core evalúa TryGetTenantId() en cada consulta, obteniendo el TenantId
    /// del usuario logueado en ese momento preciso. Esto es thread-safe porque
    /// cada request HTTP tiene su propio scope de DI e ITenantProvider.
    /// </summary>
    private static void SetTenantFilterGeneric<T>(ModelBuilder modelBuilder, ITenantProvider tenantProvider)
        where T : class, IMustHaveTenant
    {
        modelBuilder.Entity<T>().HasQueryFilter(e =>
            tenantProvider.TryGetTenantId() == null
            || e.TenantId == tenantProvider.TryGetTenantId()!.Value);
        // Nota: cuando TryGetTenantId() retorna null (admin del sistema),
        // el filtro se omite y se ven todos los tenants. Esto es intencional
        // para roles de super-administrador.
    }
}
