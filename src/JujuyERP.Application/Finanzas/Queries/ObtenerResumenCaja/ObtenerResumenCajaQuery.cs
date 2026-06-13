using MediatR;

namespace JujuyERP.Application.Finanzas.Queries.ObtenerResumenCaja;

public record ObtenerResumenCajaQuery : IRequest<ResumenCajaDto>;
