namespace JujuyERP.Application.Dashboard.Queries.ObtenerMetricasDashboard;

public record MetricasDashboardDto(
    decimal TotalVentasDia,
    decimal InversionStock,
    decimal GananciaProyectada,
    int ProductosCriticosCount
);
