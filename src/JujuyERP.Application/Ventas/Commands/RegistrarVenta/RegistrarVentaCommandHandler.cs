using JujuyERP.Application.Common.Exceptions;
using JujuyERP.Application.Common.Interfaces;
using JujuyERP.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace JujuyERP.Application.Ventas.Commands.RegistrarVenta;

public class RegistrarVentaCommandHandler : IRequestHandler<RegistrarVentaCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public RegistrarVentaCommandHandler(IApplicationDbContext context)
        => _context = context;

    public async Task<Guid> Handle(RegistrarVentaCommand request, CancellationToken cancellationToken)
    {
        if (request.Items is null || request.Items.Count == 0)
            throw new VentaInvalidaException("La venta debe contener al menos un producto.");

        var productoIds = request.Items.Select(i => i.ProductoId).Distinct().ToList();

        var productos = await _context.Productos
            .Where(p => productoIds.Contains(p.Id) && p.Activo)
            .ToListAsync(cancellationToken);

        var detalles = new List<VentaDetalle>();
        decimal total = 0;

        foreach (var item in request.Items)
        {
            if (item.Cantidad <= 0)
                throw new VentaInvalidaException("La cantidad de cada ítem debe ser mayor a cero.");

            var producto = productos.FirstOrDefault(p => p.Id == item.ProductoId)
                ?? throw new VentaInvalidaException(
                    $"El producto con ID '{item.ProductoId}' no fue encontrado o está inactivo.");

            if (producto.StockActual < item.Cantidad)
                throw new VentaInvalidaException(
                    $"Stock insuficiente para '{producto.Nombre}'. " +
                    $"Disponible: {producto.StockActual}, solicitado: {item.Cantidad}.");

            producto.StockActual -= item.Cantidad;

            var subtotal = producto.PrecioVenta * item.Cantidad;
            total += subtotal;

            detalles.Add(new VentaDetalle
            {
                ProductoId     = producto.Id,
                Cantidad       = item.Cantidad,
                PrecioUnitario = producto.PrecioVenta,
                Subtotal       = subtotal
            });
        }

        var venta = new Venta
        {
            Fecha    = DateTime.UtcNow,
            Total    = total,
            Detalles = detalles
        };

        _context.Ventas.Add(venta);

        _context.CajaMovimientos.Add(new CajaMovimiento
        {
            Fecha      = venta.Fecha,
            Tipo       = "Ingreso",
            MetodoPago = request.MetodoPago,
            Monto      = total,
            Concepto   = $"Venta #{venta.Id.ToString()[..8]}"
        });

        await _context.SaveChangesAsync(cancellationToken);

        return venta.Id;
    }
}
