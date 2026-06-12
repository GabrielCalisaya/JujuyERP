using MediatR;

namespace JujuyERP.Application.Productos.Commands.EliminarProducto;

public record EliminarProductoCommand(Guid Id) : IRequest<bool>;
