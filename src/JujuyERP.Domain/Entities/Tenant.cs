using JujuyERP.Domain.Common;
using JujuyERP.Domain.Enums;

namespace JujuyERP.Domain.Entities;

/// <summary>
/// Representa una empresa suscripta al sistema (un "tenant").
///
/// DECISIÓN DE ARQUITECTURA: Tenant NO implementa IMustHaveTenant porque
/// es la entidad raíz del sistema de multi-tenancy; ella misma ES el tenant.
/// ModulosActivosConfig almacena la configuración de Feature Flags como JSON,
/// permitiendo activar/desactivar módulos (Stock, Ventas, Distribución, etc.)
/// por empresa sin necesidad de redesplegar la aplicación.
/// </summary>
public class Tenant : AuditableEntity
{
    /// <summary>Razón social de la empresa.</summary>
    public string NombreEmpresa { get; set; } = string.Empty;

    /// <summary>
    /// Número fiscal único: RUC (Perú/Ecuador), CUIT (Argentina), RUT (Chile), etc.
    /// Almacenado como string para soportar formatos de distintos países.
    /// </summary>
    public string RucCuit { get; set; } = string.Empty;

    /// <summary>Nivel de suscripción activa.</summary>
    public PlanActivo PlanActivo { get; set; } = PlanActivo.Free;

    /// <summary>Fecha en que el tenant se registró en la plataforma.</summary>
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Configuración de Feature Toggling serializada como JSON.
    /// Ejemplo: { "modulos": ["stock", "ventas"], "maxUsuarios": 10 }
    /// Usar JSON aquí da flexibilidad sin alterar el schema de BD.
    /// </summary>
    public string ModulosActivosConfig { get; set; } = "{}";

    /// <summary>Indica si el tenant está activo y puede operar en el sistema.</summary>
    public bool Activo { get; set; } = true;

    // ── Navegación ──────────────────────────────────────────────────────────
    public ICollection<Producto> Productos { get; set; } = new List<Producto>();
    public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
}
