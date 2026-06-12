using JujuyERP.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace JujuyERP.Application.Productos.Commands.ActualizarPreciosMasivo;

public class ActualizarPreciosMasivoCommandHandler : IRequestHandler<ActualizarPreciosMasivoCommand, int>
{
    private readonly IApplicationDbContext _context;

    public ActualizarPreciosMasivoCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> Handle(ActualizarPreciosMasivoCommand request, CancellationToken cancellationToken)
    {
        var porcentaje = (double)request.PorcentajeAumento;

        var query = _context.Productos.Where(p => p.Activo);

        if (!string.IsNullOrWhiteSpace(request.Categoria))
            query = query.Where(p => p.Descripcion != null && p.Descripcion.Contains(request.Categoria));

        if (!string.IsNullOrWhiteSpace(request.Proveedor))
            query = query.Where(p => p.Descripcion != null && p.Descripcion.Contains(request.Proveedor));

        return await query.ExecuteUpdateAsync(
            setters => setters.SetProperty(
                p => p.PrecioVenta,
                p => p.PrecioVenta * (decimal)(1.0 + porcentaje / 100.0)),
            cancellationToken);
    }
}
