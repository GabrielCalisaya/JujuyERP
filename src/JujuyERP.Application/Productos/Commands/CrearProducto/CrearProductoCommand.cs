using MediatR;

namespace JujuyERP.Application.Productos.Commands.CrearProducto;

public record CrearProductoCommand(
    string? CodigoBarras,
    string Nombre,
    string? Descripcion,
    decimal PrecioVenta,
    decimal Costo,
    decimal StockActual,
    decimal StockMinimo
) : IRequest<Guid>;
