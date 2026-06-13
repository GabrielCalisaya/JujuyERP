using MediatR;

namespace JujuyERP.Application.Dashboard.Queries.ObtenerMetricasDashboard;

public record ObtenerMetricasDashboardQuery(int RangoDias = 1) : IRequest<MetricasDashboardDto>;
