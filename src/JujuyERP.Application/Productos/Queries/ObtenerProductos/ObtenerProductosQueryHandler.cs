using JujuyERP.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace JujuyERP.Application.Productos.Queries.ObtenerProductos;

public class ObtenerProductosQueryHandler : IRequestHandler<ObtenerProductosQuery, List<ProductoDto>>
{
    private readonly IApplicationDbContext _context;

    public ObtenerProductosQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProductoDto>> Handle(ObtenerProductosQuery request, CancellationToken cancellationToken)
    {
        return await _context.Productos
            .Where(p => !request.SoloActivos || p.Activo)
            .OrderBy(p => p.Nombre)
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
            .ToListAsync(cancellationToken);
    }
}
