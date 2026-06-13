using JujuyERP.Domain.Common;

namespace JujuyERP.Domain.Entities;

public class Venta : BaseEntity, IMustHaveTenant
{
    public Guid TenantId { get; set; }
    public DateTime Fecha { get; set; }
    public decimal Total { get; set; }
    public ICollection<VentaDetalle> Detalles { get; set; } = new List<VentaDetalle>();
}
