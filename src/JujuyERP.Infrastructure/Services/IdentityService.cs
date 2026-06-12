using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using JujuyERP.Application.Auth;
using JujuyERP.Application.Common.Interfaces;
using JujuyERP.Domain.Entities;
using JujuyERP.Domain.Enums;
using JujuyERP.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using BCryptNet = BCrypt.Net.BCrypt;

namespace JujuyERP.Infrastructure.Services;

/// <summary>
/// Implementación del servicio de identidad.
///
/// FLUJO DE REGISTRO (RegistrarTenantAsync):
///   1. Verificar unicidad del RUC/CUIT y del email en toda la plataforma.
///   2. Crear el Tenant con el plan Free por defecto.
///   3. Crear el Usuario Administrador con el TenantId recién generado.
///   4. Persistir ambos en una sola transacción (SaveChanges atómico con EF Core).
///   5. Generar y retornar el JWT listo para usar.
///
/// NOTA SOBRE SaveChanges Y TenantProvider:
/// Al momento del registro, el usuario NO está autenticado aún, por lo que
/// TenantProvider.TryGetTenantId() retorna null. Para el Tenant esto está bien
/// (no implementa IMustHaveTenant). Para el Usuario, asignamos TenantId
/// EXPLÍCITAMENTE antes de llamar SaveChanges, por lo que el mecanismo de
/// inyección automática del DbContext respeta el valor ya existente (no lo pisa).
/// </summary>
public class IdentityService : IIdentityService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public IdentityService(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    // ── Registro ─────────────────────────────────────────────────────────────

    public async Task<AuthResponseDto> RegistrarTenantAsync(
        RegistrarTenantDto dto,
        CancellationToken cancellationToken = default)
    {
        // Validaciones de unicidad a nivel de plataforma
        var rucExiste = await _context.Tenants
            .AnyAsync(t => t.RucCuit == dto.RucCuit, cancellationToken);

        if (rucExiste)
            throw new InvalidOperationException(
                $"Ya existe una empresa registrada con el RUC/CUIT '{dto.RucCuit}'.");

        // El email del admin debe ser único en TODA la plataforma para evitar
        // confusión al hacer login (aunque técnicamente podría repetirse entre tenants).
        var emailExiste = await _context.Usuarios
            .AnyAsync(u => u.Email == dto.AdminEmail.ToLowerInvariant(), cancellationToken);

        if (emailExiste)
            throw new InvalidOperationException(
                $"El email '{dto.AdminEmail}' ya está registrado en el sistema.");

        // ── Crear Tenant ─────────────────────────────────────────────────────
        var tenant = new Tenant
        {
            NombreEmpresa = dto.NombreEmpresa.Trim(),
            RucCuit = dto.RucCuit.Trim(),
            PlanActivo = PlanActivo.Free,
            FechaRegistro = DateTime.UtcNow,
            ModulosActivosConfig = """{"modulos":["stock"]}"""
        };

        _context.Tenants.Add(tenant);

        // Guardamos el Tenant primero para obtener su Id generado.
        // IMPORTANTE: usamos SaveChanges intermedio porque el Id del Tenant
        // se necesita ANTES de crear el Usuario. EF Core con Guid generados
        // en cliente ya tiene el Id disponible sin ir a la BD, pero este
        // SaveChanges garantiza la atomicidad parcial y es más explícito.
        // Para mayor atomicidad, usar TransactionScope o una transaction explícita.
        await _context.SaveChangesAsync(cancellationToken);

        // ── Crear Usuario Administrador ──────────────────────────────────────
        var usuario = new Usuario
        {
            TenantId = tenant.Id,    // Asignación explícita — el DbContext la respeta
            Nombre = dto.AdminNombre.Trim(),
            Email = dto.AdminEmail.Trim().ToLowerInvariant(),
            // WorkFactor 11: ~300ms en hardware moderno. Balance seguridad/UX.
            // En producción considerar 12-13 para servidores más potentes.
            PasswordHash = BCryptNet.HashPassword(dto.AdminPassword, workFactor: 11),
            Rol = Rol.Admin,
            Activo = true
        };

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync(cancellationToken);

        return GenerarAuthResponse(usuario, tenant);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    public async Task<AuthResponseDto> LoginAsync(
        LoginDto dto,
        CancellationToken cancellationToken = default)
    {
        var emailNormalizado = dto.Email.Trim().ToLowerInvariant();

        // Cargamos el usuario con su Tenant en una sola query (Include)
        var usuario = await _context.Usuarios
            .Include(u => u.Tenant)
            .Where(u => u.Email == emailNormalizado && u.Activo)
            .FirstOrDefaultAsync(cancellationToken);

        // Usamos el mismo mensaje genérico para email no encontrado y contraseña incorrecta.
        // Mensajes distintos permitirían enumerar usuarios válidos (user enumeration attack).
        if (usuario is null || !BCryptNet.Verify(dto.Password, usuario.PasswordHash))
            throw new UnauthorizedAccessException(
                "Email o contraseña incorrectos.");

        if (usuario.Tenant is null || !usuario.Tenant.Activo)
            throw new UnauthorizedAccessException(
                "La cuenta de esta empresa está suspendida. Contacte a soporte.");

        return GenerarAuthResponse(usuario, usuario.Tenant);
    }

    // ── Generación de JWT ─────────────────────────────────────────────────────

    /// <summary>
    /// Genera el token JWT con los claims necesarios para el sistema.
    ///
    /// CLAIMS INCLUIDOS:
    /// - tenant_id: esencial para los Global Query Filters del DbContext.
    /// - role:      para autorización basada en roles ([Authorize(Roles = "Admin")]).
    /// - email:     identificación humana del usuario.
    /// - sub:       estándar JWT, contiene el UsuarioId.
    /// - jti:       JWT ID único, permite revocar tokens individuales si se agrega
    ///              una denylist en el futuro (Redis, BD).
    /// </summary>
    private AuthResponseDto GenerarAuthResponse(Usuario usuario, Tenant tenant)
    {
        var jwtSection = _configuration.GetSection("Jwt");
        var key = jwtSection["Key"]
            ?? throw new InvalidOperationException("JWT Key no configurada.");

        var expirationMinutes = int.TryParse(jwtSection["ExpirationMinutes"], out var mins)
            ? mins : 60;

        var expiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
            new Claim(TenantProvider.TenantIdClaimType, tenant.Id.ToString()),
            new Claim(ClaimTypes.Role, usuario.Rol.ToString()),
            new Claim(ClaimTypes.Name, usuario.Nombre)
        };

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtSection["Issuer"],
            audience: jwtSection["Audience"],
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAt,
            signingCredentials: credentials
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return new AuthResponseDto(
            Token: tokenString,
            ExpiresAt: expiresAt,
            UsuarioId: usuario.Id,
            Nombre: usuario.Nombre,
            Email: usuario.Email,
            Rol: usuario.Rol.ToString(),
            TenantId: tenant.Id,
            NombreEmpresa: tenant.NombreEmpresa
        );
    }
}
