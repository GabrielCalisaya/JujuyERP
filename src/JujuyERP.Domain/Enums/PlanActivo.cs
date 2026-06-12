namespace JujuyERP.Domain.Enums;

/// <summary>
/// Define los niveles de suscripción del SaaS.
/// Usando enum en lugar de string evitamos magic strings y
/// habilitamos Feature Toggling tipado junto con ModulosActivosConfig.
/// </summary>
public enum PlanActivo
{
    /// <summary>Plan gratuito con funcionalidades básicas.</summary>
    Free = 0,

    /// <summary>Plan estándar para comercios pequeños.</summary>
    Starter = 1,

    /// <summary>Plan profesional con módulos de distribución.</summary>
    Professional = 2,

    /// <summary>Plan empresarial con todos los módulos habilitados.</summary>
    Enterprise = 3
}
