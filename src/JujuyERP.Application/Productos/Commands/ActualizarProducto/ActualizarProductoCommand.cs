using MediatR;

namespace JujuyERP.Application.Productos.Commands.ActualizarProducto;

public record ActualizarProductoCommand(
    Guid Id,
    string? CodigoBarras,
    string Nombre,
    string? Descripcion,
    decimal PrecioVenta,
    decimal Costo,
    decimal StockActual,
    decimal StockMinimo
) : IRequest<bool>;
