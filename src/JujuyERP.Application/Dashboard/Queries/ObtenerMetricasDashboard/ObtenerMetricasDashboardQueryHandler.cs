using JujuyERP.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace JujuyERP.Application.Dashboard.Queries.ObtenerMetricasDashboard;

public class ObtenerMetricasDashboardQueryHandler
    : IRequestHandler<ObtenerMetricasDashboardQuery, MetricasDashboardDto>
{
    private readonly IApplicationDbContext _context;

    public ObtenerMetricasDashboardQueryHandler(IApplicationDbContext context)
        => _context = context;

    public async Task<MetricasDashboardDto> Handle(
        ObtenerMetricasDashboardQuery request,
        CancellationToken cancellationToken)
    {
        var dias       = Math.Max(1, request.RangoDias);
        var ahora      = DateTime.UtcNow;
        var inicio     = ahora.Date.AddDays(-(dias - 1));
        var prevInicio = inicio.AddDays(-dias);

        var totalVentas = await _context.Ventas
            .Where(v => v.Fecha >= inicio)
            .SumAsync(v => (decimal?)v.Total, cancellationToken) ?? 0m;

        var totalPrevio = await _context.Ventas
            .Where(v => v.Fecha >= prevInicio && v.Fecha < inicio)
            .SumAsync(v => (decimal?)v.Total, cancellationToken) ?? 0m;

        var crecimiento = totalPrevio == 0
            ? (totalVentas > 0 ? 100m : 0m)
            : Math.Round((totalVentas - totalPrevio) / totalPrevio * 100, 1);

        var inversionStock = await _context.Productos
            .Where(p => p.Activo)
            .SumAsync(p => (decimal?)(p.Costo * p.StockActual), cancellationToken) ?? 0m;

        var gananciaProyectada = await _context.Productos
            .Where(p => p.Activo)
            .SumAsync(p => (decimal?)((p.PrecioVenta - p.Costo) * p.StockActual), cancellationToken) ?? 0m;

        var productosCriticosCount = await _context.Productos
            .Where(p => p.Activo && p.StockActual <= p.StockMinimo)
            .CountAsync(cancellationToken);

        var fechaSparkline = ahora.Date.AddDays(-6);
        var ventasRecientes7 = await _context.Ventas
            .Where(v => v.Fecha >= fechaSparkline)
            .Select(v => new { v.Fecha, v.Total })
            .ToListAsync(cancellationToken);

        var tendencia = Enumerable.Range(0, 7)
            .Select(i => {
                var dia = ahora.Date.AddDays(i - 6);
                return ventasRecientes7
                    .Where(v => v.Fecha.Date == dia)
                    .Sum(v => v.Total);
            })
            .ToArray();

        var ventaIdsEnPeriodo = await _context.Ventas
            .Where(v => v.Fecha >= inicio)
            .Select(v => v.Id)
            .ToListAsync(cancellationToken);

        List<ProductoVentasDto> topProductos = [];

        if (ventaIdsEnPeriodo.Count > 0)
        {
            var detalles = await _context.VentaDetalles
                .Where(d => ventaIdsEnPeriodo.Contains(d.VentaId))
                .Select(d => new { d.ProductoId, d.Cantidad, d.Subtotal })
                .ToListAsync(cancellationToken);

            var topRaw = detalles
                .GroupBy(d => d.ProductoId)
                .Select(g => new {
                    ProductoId    = g.Key,
                    CantidadTotal = g.Sum(d => d.Cantidad),
                    Recaudacion   = g.Sum(d => d.Subtotal)
                })
                .OrderByDescending(x => x.Recaudacion)
                .Take(5)
                .ToList();

            var topIds = topRaw.Select(x => x.ProductoId).ToList();
            var nombres = await _context.Productos
                .Where(p => topIds.Contains(p.Id))
                .Select(p => new { p.Id, p.Nombre })
                .ToDictionaryAsync(p => p.Id, p => p.Nombre, cancellationToken);

            topProductos = topRaw
                .Select(x => new ProductoVentasDto(
                    nombres.GetValueOrDefault(x.ProductoId, "—"),
                    x.CantidadTotal,
                    x.Recaudacion))
                .ToList();
        }

        var ventasActividad = await _context.Ventas
            .OrderByDescending(v => v.Fecha)
            .Take(5)
            .Select(v => new { v.Fecha, v.Total })
            .ToListAsync(cancellationToken);

        var criticos = await _context.Productos
            .Where(p => p.Activo && p.StockActual <= p.StockMinimo)
            .Select(p => new { p.Nombre, p.StockActual })
            .Take(4)
            .ToListAsync(cancellationToken);

        var actividad = ventasActividad
            .Select(v => new EventoActividadDto("venta",
                $"Venta cerrada por ${v.Total:N0}", v.Fecha))
            .Concat(criticos.Select(p => new EventoActividadDto("alerta",
                $"Stock crítico: {p.Nombre} (queda {p.StockActual})", ahora)))
            .OrderByDescending(x => x.Fecha)
            .Take(8)
            .ToList();

        return new MetricasDashboardDto(
            TotalVentas:            totalVentas,
            InversionStock:         inversionStock,
            GananciaProyectada:     gananciaProyectada,
            ProductosCriticosCount: productosCriticosCount,
            CrecimientoVentas:      crecimiento,
            TendenciaVentas:        tendencia,
            ProductosMasVendidos:   topProductos,
            ActividadReciente:      actividad);
    }
}
