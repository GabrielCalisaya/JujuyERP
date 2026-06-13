using JujuyERP.Application.Common.Exceptions;
using JujuyERP.Application.Ventas.Commands.RegistrarVenta;
using JujuyERP.Application.Ventas.Queries.ObtenerHistorialVentas;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JujuyERP.WebAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class VentasController : ControllerBase
{
    private readonly ISender _mediator;

    public VentasController(ISender mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<VentaResumenDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<VentaResumenDto>>> ObtenerHistorial(
        CancellationToken cancellationToken)
    {
        var historial = await _mediator.Send(new ObtenerHistorialVentasQuery(), cancellationToken);
        return Ok(historial);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<Guid>> RegistrarVenta(
        [FromBody] RegistrarVentaCommand command,
        CancellationToken cancellationToken)
    {
        try
        {
            var id = await _mediator.Send(command, cancellationToken);
            return CreatedAtAction(nameof(RegistrarVenta), new { id }, id);
        }
        catch (VentaInvalidaException ex)
        {
            return UnprocessableEntity(new { detail = ex.Message });
        }
    }
}
