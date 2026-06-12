namespace JujuyERP.Application.Productos.Queries.ObtenerProductos;

public record ProductoDto(
    Guid Id,
    string? CodigoBarras,
    string Nombre,
    string? Descripcion,
    decimal PrecioVenta,
    decimal Costo,
    decimal StockActual,
    decimal StockMinimo,
    bool Activo
);
