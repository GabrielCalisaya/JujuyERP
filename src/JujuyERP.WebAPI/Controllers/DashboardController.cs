using JujuyERP.Application.Dashboard.Queries.ObtenerMetricasDashboard;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JujuyERP.WebAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class DashboardController : ControllerBase
{
    private readonly ISender _mediator;

    public DashboardController(ISender mediator) => _mediator = mediator;

    [HttpGet("metricas")]
    [ProducesResponseType(typeof(MetricasDashboardDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<MetricasDashboardDto>> ObtenerMetricas(
        [FromQuery] int rangoDias = 1,
        CancellationToken cancellationToken = default)
        => Ok(await _mediator.Send(new ObtenerMetricasDashboardQuery(rangoDias), cancellationToken));
}
