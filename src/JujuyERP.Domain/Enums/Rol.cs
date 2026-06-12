namespace JujuyERP.Domain.Enums;

/// <summary>
/// Roles de usuario dentro de un tenant.
/// Diseñado para escalar: en el futuro se pueden agregar Supervisor, Vendedor, etc.
/// Se almacena como string en la BD para legibilidad en consultas directas y
/// compatibilidad con los Claims del JWT sin tabla de traducción.
/// </summary>
public enum Rol
{
    /// <summary>Acceso total al tenant: configuración, reportes, usuarios.</summary>
    Admin = 0,

    /// <summary>Acceso operativo: ventas, cobros, consulta de stock.</summary>
    Cajero = 1
}
