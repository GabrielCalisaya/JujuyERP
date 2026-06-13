namespace JujuyERP.Application.Ventas.Queries.ObtenerHistorialVentas;

public record VentaResumenDto(
    Guid Id,
    DateTime Fecha,
    int CantidadItems,
    decimal Total
);
