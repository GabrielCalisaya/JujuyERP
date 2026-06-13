using MediatR;

namespace JujuyERP.Application.Dashboard.Queries.ObtenerMetricasDashboard;

public record ObtenerMetricasDashboardQuery : IRequest<MetricasDashboardDto>;
