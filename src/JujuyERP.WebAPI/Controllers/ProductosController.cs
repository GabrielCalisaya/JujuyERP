using JujuyERP.Application.Productos.Commands.ActualizarPreciosMasivo;
using JujuyERP.Application.Productos.Commands.ActualizarProducto;
using JujuyERP.Application.Productos.Commands.CrearProducto;
using JujuyERP.Application.Productos.Commands.EliminarProducto;
using JujuyERP.Application.Productos.Queries.ObtenerProductos;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProductoDto = JujuyERP.Application.Productos.Queries.ObtenerProductos.ProductoDto;

namespace JujuyERP.WebAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ProductosController : ControllerBase
{
    private readonly ISender _mediator;

    public ProductosController(ISender mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<ProductoDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ProductoDto>>> GetProductos(
        [FromQuery] bool soloActivos = true,
        CancellationToken cancellationToken = default)
    {
        var productos = await _mediator.Send(new ObtenerProductosQuery(soloActivos), cancellationToken);
        return Ok(productos);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProductoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductoDto>> GetProducto(
        Guid id,
        CancellationToken cancellationToken)
    {
        var producto = await _mediator.Send(new ObtenerProductoByIdQuery(id), cancellationToken);

        if (producto is null)
            return NotFound();

        return Ok(producto);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Guid>> CrearProducto(
        [FromBody] CrearProductoCommand command,
        CancellationToken cancellationToken)
    {
        var id = await _mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetProducto), new { id }, id);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActualizarProducto(
        Guid id,
        [FromBody] ActualizarProductoCommand command,
        CancellationToken cancellationToken)
    {
        var updated = await _mediator.Send(command with { Id = id }, cancellationToken);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EliminarProducto(
        Guid id,
        CancellationToken cancellationToken)
    {
        var deleted = await _mediator.Send(new EliminarProductoCommand(id), cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPut("actualizar-precios-masivo")]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    public async Task<ActionResult<int>> ActualizarPreciosMasivo(
        [FromBody] ActualizarPreciosMasivoCommand command,
        CancellationToken cancellationToken)
    {
        var afectados = await _mediator.Send(command, cancellationToken);
        return Ok(new { productosActualizados = afectados });
    }
}
