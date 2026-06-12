using JujuyERP.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace JujuyERP.Application.Productos.Commands.ActualizarProducto;

public class ActualizarProductoCommandHandler : IRequestHandler<ActualizarProductoCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public ActualizarProductoCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(ActualizarProductoCommand request, CancellationToken cancellationToken)
    {
        var producto = await _context.Productos
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (producto is null)
            return false;

        producto.CodigoBarras = request.CodigoBarras;
        producto.Nombre       = request.Nombre;
        producto.Descripcion  = request.Descripcion;
        producto.PrecioVenta  = request.PrecioVenta;
        producto.Costo        = request.Costo;
        producto.StockActual  = request.StockActual;
        producto.StockMinimo  = request.StockMinimo;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
