using MediatR;

namespace JujuyERP.Application.Productos.Queries.ObtenerProductos;

public record ObtenerProductosQuery(bool SoloActivos = true) : IRequest<List<ProductoDto>>;
