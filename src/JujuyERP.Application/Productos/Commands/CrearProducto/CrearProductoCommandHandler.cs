using JujuyERP.Application.Common.Interfaces;
using JujuyERP.Domain.Entities;
using MediatR;

namespace JujuyERP.Application.Productos.Commands.CrearProducto;

public class CrearProductoCommandHandler : IRequestHandler<CrearProductoCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CrearProductoCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CrearProductoCommand request, CancellationToken cancellationToken)
    {
        var producto = new Producto
        {
            CodigoBarras = request.CodigoBarras,
            Nombre = request.Nombre,
            Descripcion = request.Descripcion,
            PrecioVenta = request.PrecioVenta,
            Costo = request.Costo,
            StockActual = request.StockActual,
            StockMinimo = request.StockMinimo,
            Activo = true
        };

        _context.Productos.Add(producto);
        await _context.SaveChangesAsync(cancellationToken);

        return producto.Id;
    }
}
