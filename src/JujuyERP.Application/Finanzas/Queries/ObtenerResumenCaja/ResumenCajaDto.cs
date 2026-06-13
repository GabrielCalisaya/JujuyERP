namespace JujuyERP.Application.Finanzas.Queries.ObtenerResumenCaja;

public record MovimientoCajaDto(
    DateTime Fecha,
    string   Tipo,
    string   MetodoPago,
    decimal  Monto,
    string   Concepto
);

public record ResumenCajaDto(
    decimal TotalHoy,
    decimal SaldoEfectivo,
    decimal SaldoDebito,
    decimal SaldoCredito,
    decimal SaldoTransferencia,
    List<MovimientoCajaDto> Movimientos
);
