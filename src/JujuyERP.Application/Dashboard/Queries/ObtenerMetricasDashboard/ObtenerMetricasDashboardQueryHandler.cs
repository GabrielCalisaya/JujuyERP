using JujuyERP.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace JujuyERP.Application.Dashboard.Queries.ObtenerMetricasDashboard;

public class ObtenerMetricasDashboardQueryHandler
    : IRequestHandler<ObtenerMetricasDashboardQuery, MetricasDashboardDto>
{
    private readonly IApplicationDbContext _context;

    public ObtenerMetricasDashboardQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<MetricasDashboardDto> Handle(
        ObtenerMetricasDashboardQuery request,
        CancellationToken cancellationToken)
    {
        var inicioHoy = DateTime.UtcNow.Date;
        var finHoy    = inicioHoy.AddDays(1);

        var totalVentasDia = await _context.Ventas
            .Where(v => v.Fecha >= inicioHoy && v.Fecha < finHoy)
            .SumAsync(v => (decimal?)v.Total, cancellationToken) ?? 0m;

        var inversionStock = await _context.Productos
            .Where(p => p.Activo)
            .SumAsync(p => (decimal?)(p.Costo * p.StockActual), cancellationToken) ?? 0m;

        var gananciaProyectada = await _context.Productos
            .Where(p => p.Activo)
            .SumAsync(p => (decimal?)((p.PrecioVenta - p.Costo) * p.StockActual), cancellationToken) ?? 0m;

        var productosCriticosCount = await _context.Productos
            .Where(p => p.Activo && p.StockActual <= p.StockMinimo)
            .CountAsync(cancellationToken);

        return new MetricasDashboardDto(
            totalVentasDia,
            inversionStock,
            gananciaProyectada,
            productosCriticosCount);
    }
}
