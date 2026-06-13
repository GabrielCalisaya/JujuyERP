using MediatR;

namespace JujuyERP.Application.Ventas.Commands.RegistrarVenta;

public record ItemVentaDto(Guid ProductoId, int Cantidad);

public record RegistrarVentaCommand(List<ItemVentaDto> Items, string MetodoPago = "Efectivo") : IRequest<Guid>;
