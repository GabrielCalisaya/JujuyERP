namespace JujuyERP.Domain.Common;

/// <summary>
/// Clase base para todas las entidades del dominio.
/// Centraliza el identificador y los metadatos de auditoría (patrón Auditable Entity).
/// Al tener la clave primaria aquí, evitamos repetirla en cada entidad y
/// garantizamos consistencia en toda la solución.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
}

/// <summary>
/// Extiende BaseEntity con campos de auditoría para trazabilidad completa:
/// quién creó/modificó un registro y cuándo. Fundamental en sistemas ERP
/// donde la auditoría es un requisito legal y operativo.
/// </summary>
public abstract class AuditableEntity : BaseEntity
{
    public DateTime FechaCreacion { get; set; }
    public string? CreadoPor { get; set; }
    public DateTime? FechaModificacion { get; set; }
    public string? ModificadoPor { get; set; }
}
