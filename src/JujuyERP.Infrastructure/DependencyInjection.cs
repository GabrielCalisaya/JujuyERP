using JujuyERP.Application.Common.Interfaces;
using JujuyERP.Infrastructure.Persistence;
using JujuyERP.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace JujuyERP.Infrastructure;

/// <summary>
/// Punto único de registro de todos los servicios de la capa Infrastructure.
///
/// DECISIÓN DE ARQUITECTURA: Cada capa expone un único método de extensión
/// "AddXxxServices()" sobre IServiceCollection. Program.cs solo llama a estos
/// métodos, sin conocer los detalles internos de cada capa. Esto es el patrón
/// "Composition Root" y garantiza que el arranque de la app sea declarativo y legible.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ── Base de datos ────────────────────────────────────────────────────
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "Connection string 'DefaultConnection' no encontrada en appsettings.json");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlite(
                connectionString,
                sqliteOptions =>
                {
                    sqliteOptions.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
                }));

        // Registramos el DbContext también como IApplicationDbContext
        // para que Application pueda inyectarlo sin conocer la implementación concreta.
        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<ApplicationDbContext>());

        // ── Multi-tenancy ────────────────────────────────────────────────────
        // IHttpContextAccessor es necesario para que TenantProvider pueda
        // acceder al HttpContext desde un servicio registrado en DI.
        services.AddHttpContextAccessor();

        // Scoped: una instancia por request HTTP, alineado con el ciclo de vida
        // del DbContext. Ambos deben tener el mismo scope para garantizar que
        // el TenantId sea consistente durante toda la solicitud.
        services.AddScoped<ITenantProvider, TenantProvider>();

        // ── Autenticación / Identidad ────────────────────────────────────────
        services.AddScoped<IIdentityService, IdentityService>();

        return services;
    }
}
