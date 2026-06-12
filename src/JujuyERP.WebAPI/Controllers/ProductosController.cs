using JujuyERP.Application.Common.Interfaces;
using JujuyERP.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JujuyERP.WebAPI.Controllers;

/// <summary>
/// Controlador del módulo de Catálogo de Stock.
///
/// DEMOSTRACIÓN DE MULTI-TENANCY TRANSPARENTE:
/// Este controlador NO necesita filtrar por TenantId en ninguna consulta.
/// El Global Query Filter del DbContext aplica el filtro automáticamente.
/// Un usuario del Tenant A NUNCA verá productos del Tenant B, sin importar
/// lo que haga el desarrollador.
///
/// NOTA: En una implementación completa con CQRS/MediatR, los controladores
/// despacharían Commands/Queries en lugar de usar el DbContext directamente.
/// Este ejemplo es intencional para demostrar la transparencia del filtro.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ProductosController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;
    private readonly ILogger<ProductosController> _logger;

    public ProductosController(
        IApplicationDbContext context,
        ITenantProvider tenantProvider,
        ILogger<ProductosController> logger)
    {
        _context = context;
        _tenantProvider = tenantProvider;
        _logger = logger;
    }

    /// <summary>
    /// Retorna todos los productos activos del tenant autenticado.
    /// El filtro por TenantId es aplicado automáticamente por EF Core.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ProductoDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ProductoDto>>> GetProductos(
        CancellationToken cancellationToken)
    {
        var productos = await _context.Productos
            .Where(p => p.Activo)
            .OrderBy(p => p.Nombre)
            .Select(p => new ProductoDto(
                p.Id,
                p.CodigoBarras,
                p.Nombre,
                p.Descripcion,
                p.PrecioVenta,
                p.Costo,
                p.StockActual,
                p.StockMinimo,
                p.Activo))
            .ToListAsync(cancellationToken);

        return Ok(productos);
    }

    /// <summary>
    /// Retorna un producto por Id. EF Core garantiza que solo se busca
    /// dentro del tenant del usuario autenticado.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProductoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductoDto>> GetProducto(
        Guid id,
        CancellationToken cancellationToken)
    {
        var producto = await _context.Productos
            .Where(p => p.Id == id)
            .Select(p => new ProductoDto(
                p.Id,
                p.CodigoBarras,
                p.Nombre,
                p.Descripcion,
                p.PrecioVenta,
                p.Costo,
                p.StockActual,
                p.StockMinimo,
                p.Activo))
            .FirstOrDefaultAsync(cancellationToken);

        if (producto is null)
            return NotFound();

        return Ok(producto);
    }

    /// <summary>
    /// Crea un nuevo producto. El TenantId se inyecta automáticamente en
    /// SaveChangesAsync(); NO necesitamos asignarlo aquí.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ProductoDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProductoDto>> CrearProducto(
        [FromBody] CrearProductoRequest request,
        CancellationToken cancellationToken)
    {
        var producto = new Producto
        {
            // TenantId se asignará automáticamente en ApplicationDbContext.SaveChangesAsync()
            CodigoBarras = request.CodigoBarras,
            Nombre = request.Nombre,
            Descripcion = request.Descripcion,
            PrecioVenta = request.PrecioVenta,
            Costo = request.Costo,
            StockActual = request.StockInicial,
            StockMinimo = request.StockMinimo,
            Activo = true
        };

        _context.Productos.Add(producto);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Producto {ProductoId} '{Nombre}' creado para Tenant {TenantId}",
            producto.Id, producto.Nombre, producto.TenantId);

        var dto = new ProductoDto(
            producto.Id, producto.CodigoBarras, producto.Nombre,
            producto.Descripcion, producto.PrecioVenta, producto.Costo,
            producto.StockActual, producto.StockMinimo, producto.Activo);

        return CreatedAtAction(nameof(GetProducto), new { id = producto.Id }, dto);
    }
}

// ── DTOs ─────────────────────────────────────────────────────────────────────
// Records de C# 9+: inmutables, con equals y toString incluidos por defecto.
// No exponemos las entidades del dominio directamente para evitar over-posting
// y mantener el contrato de la API desacoplado del modelo interno.

public record ProductoDto(
    Guid Id,
    string? CodigoBarras,
    string Nombre,
    string? Descripcion,
    decimal PrecioVenta,
    decimal Costo,
    decimal StockActual,
    decimal StockMinimo,
    bool Activo);

public record CrearProductoRequest(
    string? CodigoBarras,
    string Nombre,
    string? Descripcion,
    decimal PrecioVenta,
    decimal Costo,
    decimal StockInicial,
    decimal StockMinimo);
