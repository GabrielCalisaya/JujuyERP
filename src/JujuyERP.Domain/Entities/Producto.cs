using JujuyERP.Domain.Common;

namespace JujuyERP.Domain.Entities;

/// <summary>
/// Entidad central del módulo de Catálogo de Stock.
///
/// DECISIÓN DE ARQUITECTURA: Implementa IMustHaveTenant para que EF Core
/// aplique automáticamente el filtro por TenantId en TODAS las queries.
/// Ningún desarrollador puede "olvidar" filtrar por empresa; el aislamiento
/// de datos es transparente e imperativo.
///
/// Usamos decimal para PrecioVenta y Costo (nunca float/double para dinero)
/// para evitar errores de redondeo en operaciones financieras.
/// </summary>
public class Producto : AuditableEntity, IMustHaveTenant
{
    // ── Multi-tenancy ────────────────────────────────────────────────────────
    public Guid TenantId { get; set; }

    // ── Identificación ───────────────────────────────────────────────────────

    /// <summary>
    /// Código de barras EAN-13, QR, o código interno.
    /// Nullable porque puede generarse después del alta inicial.
    /// </summary>
    public string? CodigoBarras { get; set; }

    /// <summary>Nombre comercial visible en pantalla y tickets.</summary>
    public string Nombre { get; set; } = string.Empty;

    /// <summary>Descripción larga para catálogos o ecommerce.</summary>
    public string? Descripcion { get; set; }

    // ── Precios y Costos ─────────────────────────────────────────────────────

    /// <summary>Precio de venta al público. Siempre positivo.</summary>
    public decimal PrecioVenta { get; set; }

    /// <summary>
    /// Costo de adquisición. Usado para calcular margen y utilidad.
    /// Se mantiene separado del precio para reportes de rentabilidad.
    /// </summary>
    public decimal Costo { get; set; }

    // ── Inventario ───────────────────────────────────────────────────────────

    /// <summary>Cantidad disponible en depósito. Actualizado por movimientos de stock.</summary>
    public decimal StockActual { get; set; }

    /// <summary>
    /// Umbral mínimo. Cuando StockActual cae por debajo, se genera
    /// una alerta de reposición (lógica a implementar en Application).
    /// </summary>
    public decimal StockMinimo { get; set; }

    /// <summary>Soft-delete: los productos inactivos no aparecen en ventas ni catálogos.</summary>
    public bool Activo { get; set; } = true;

    // ── Navegación ───────────────────────────────────────────────────────────
    public Tenant? Tenant { get; set; }
}
