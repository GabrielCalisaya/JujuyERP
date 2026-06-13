using JujuyERP.Domain.Common;

namespace JujuyERP.Domain.Entities;

public class VentaDetalle : BaseEntity
{
    public Guid VentaId { get; set; }
    public Guid ProductoId { get; set; }
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }

    public Venta? Venta { get; set; }
    public Producto? Producto { get; set; }
}
