using JujuyERP.Application.Finanzas.Queries.ObtenerResumenCaja;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JujuyERP.WebAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/finanzas/caja")]
[Produces("application/json")]
public class CajaController : ControllerBase
{
    private readonly ISender _mediator;

    public CajaController(ISender mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ResumenCajaDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ResumenCajaDto>> ObtenerResumen(CancellationToken ct)
        => Ok(await _mediator.Send(new ObtenerResumenCajaQuery(), ct));
}
