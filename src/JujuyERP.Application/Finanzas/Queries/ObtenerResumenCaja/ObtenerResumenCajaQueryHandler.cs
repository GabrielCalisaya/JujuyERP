using JujuyERP.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace JujuyERP.Application.Finanzas.Queries.ObtenerResumenCaja;

public class ObtenerResumenCajaQueryHandler
    : IRequestHandler<ObtenerResumenCajaQuery, ResumenCajaDto>
{
    private readonly IApplicationDbContext _context;

    public ObtenerResumenCajaQueryHandler(IApplicationDbContext context)
        => _context = context;

    public async Task<ResumenCajaDto> Handle(
        ObtenerResumenCajaQuery request,
        CancellationToken cancellationToken)
    {
        var inicio = DateTime.UtcNow.Date;
        var fin    = inicio.AddDays(1);

        var movimientosHoy = await _context.CajaMovimientos
            .Where(m => m.Fecha >= inicio && m.Fecha < fin)
            .OrderByDescending(m => m.Fecha)
            .Select(m => new MovimientoCajaDto(m.Fecha, m.Tipo, m.MetodoPago, m.Monto, m.Concepto))
            .ToListAsync(cancellationToken);

        decimal Saldo(string metodo) => movimientosHoy
            .Where(m => m.MetodoPago == metodo)
            .Sum(m => m.Tipo == "Ingreso" ? m.Monto : -m.Monto);

        return new ResumenCajaDto(
            TotalHoy:          movimientosHoy.Sum(m => m.Tipo == "Ingreso" ? m.Monto : -m.Monto),
            SaldoEfectivo:     Saldo("Efectivo"),
            SaldoDebito:       Saldo("Debito"),
            SaldoCredito:      Saldo("Credito"),
            SaldoTransferencia:Saldo("Transferencia"),
            Movimientos:       movimientosHoy
        );
    }
}
