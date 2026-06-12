using JujuyERP.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace JujuyERP.Application.Productos.Commands.EliminarProducto;

public class EliminarProductoCommandHandler : IRequestHandler<EliminarProductoCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public EliminarProductoCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(EliminarProductoCommand request, CancellationToken cancellationToken)
    {
        var producto = await _context.Productos
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (producto is null)
            return false;

        _context.Productos.Remove(producto);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
