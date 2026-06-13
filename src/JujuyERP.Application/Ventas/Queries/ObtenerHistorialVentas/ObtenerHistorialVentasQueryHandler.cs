using JujuyERP.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace JujuyERP.Application.Ventas.Queries.ObtenerHistorialVentas;

public class ObtenerHistorialVentasQueryHandler
    : IRequestHandler<ObtenerHistorialVentasQuery, List<VentaResumenDto>>
{
    private readonly IApplicationDbContext _context;

    public ObtenerHistorialVentasQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<VentaResumenDto>> Handle(
        ObtenerHistorialVentasQuery request,
        CancellationToken cancellationToken)
    {
        return await _context.Ventas
            .OrderByDescending(v => v.Fecha)
            .Select(v => new VentaResumenDto(
                v.Id,
                v.Fecha,
                v.Detalles.Sum(d => d.Cantidad),
                v.Total))
            .ToListAsync(cancellationToken);
    }
}
