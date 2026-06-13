using MediatR;

namespace JujuyERP.Application.Ventas.Queries.ObtenerHistorialVentas;

public record ObtenerHistorialVentasQuery : IRequest<List<VentaResumenDto>>;
