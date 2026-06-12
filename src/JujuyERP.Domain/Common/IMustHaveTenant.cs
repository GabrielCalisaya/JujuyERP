namespace JujuyERP.Domain.Common;

/// <summary>
/// Contrato de Multi-tenancy a nivel de dominio.
///
/// DECISIÓN DE ARQUITECTURA: Usamos el patrón "Shared Database, Shared Schema"
/// (un solo schema donde cada fila tiene un TenantId). Es el modelo más
/// económico para un SaaS de comercios locales. La alternativa (schema por tenant)
/// tiene un costo operativo mucho mayor.
///
/// Cualquier entidad de negocio que deba quedar aislada por empresa DEBE
/// implementar esta interfaz. El DbContext la detectará automáticamente para
/// aplicar los Global Query Filters de EF Core, garantizando aislamiento
/// de datos sin intervención manual del desarrollador en cada consulta.
/// </summary>
public interface IMustHaveTenant
{
    Guid TenantId { get; set; }
}
