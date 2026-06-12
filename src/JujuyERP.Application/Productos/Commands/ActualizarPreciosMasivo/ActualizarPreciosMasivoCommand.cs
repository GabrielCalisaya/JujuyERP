using MediatR;

namespace JujuyERP.Application.Productos.Commands.ActualizarPreciosMasivo;

public record ActualizarPreciosMasivoCommand(
    decimal PorcentajeAumento,
    string? Categoria = null,
    string? Proveedor = null
) : IRequest<int>;
