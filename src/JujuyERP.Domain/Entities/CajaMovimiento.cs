using JujuyERP.Domain.Common;

namespace JujuyERP.Domain.Entities;

public class CajaMovimiento : IMustHaveTenant
{
    public Guid   Id         { get; set; } = Guid.NewGuid();
    public Guid   TenantId   { get; set; }
    public DateTime Fecha    { get; set; } = DateTime.UtcNow;
    public string Tipo       { get; set; } = "Ingreso";
    public string MetodoPago { get; set; } = "Efectivo";
    public decimal Monto     { get; set; }
    public string Concepto   { get; set; } = string.Empty;
}
