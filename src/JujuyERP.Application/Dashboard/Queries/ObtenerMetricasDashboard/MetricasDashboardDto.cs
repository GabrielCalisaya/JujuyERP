namespace JujuyERP.Application.Dashboard.Queries.ObtenerMetricasDashboard;

public record ProductoVentasDto(string Nombre, int CantidadVendida, decimal Recaudacion);

public record EventoActividadDto(string Tipo, string Descripcion, DateTime Fecha);

public record MetricasDashboardDto(
    decimal  TotalVentas,
    decimal  InversionStock,
    decimal  GananciaProyectada,
    int      ProductosCriticosCount,
    decimal  CrecimientoVentas,
    decimal[] TendenciaVentas,
    List<ProductoVentasDto>  ProductosMasVendidos,
    List<EventoActividadDto> ActividadReciente
);
