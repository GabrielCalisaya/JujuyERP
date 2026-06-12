using JujuyERP.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace JujuyERP.Application.Productos.Queries.ObtenerProductos;

public record ObtenerProductoByIdQuery(Guid Id) : IRequest<ProductoDto?>;

public class ObtenerProductoByIdQueryHandler : IRequestHandler<ObtenerProductoByIdQuery, ProductoDto?>
{
    private readonly IApplicationDbContext _context;

    public ObtenerProductoByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProductoDto?> Handle(ObtenerProductoByIdQuery request, CancellationToken cancellationToken)
    {
        return await _context.Productos
            .Where(p => p.Id == request.Id)
            .Select(p => new ProductoDto(
                p.Id,
                p.CodigoBarras,
                p.Nombre,
                p.Descripcion,
                p.PrecioVenta,
                p.Costo,
                p.StockActual,
                p.StockMinimo,
                p.Activo))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
