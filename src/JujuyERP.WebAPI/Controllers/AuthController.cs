using JujuyERP.Application.Auth;
using JujuyERP.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JujuyERP.WebAPI.Controllers;

/// <summary>
/// Controlador público de autenticación.
/// Todos sus endpoints son [AllowAnonymous] porque son el punto de entrada al sistema.
///
/// PATRÓN DE MANEJO DE ERRORES:
/// Capturamos las excepciones tipadas de IIdentityService y las convertimos en
/// respuestas HTTP semánticamente correctas. Esto es responsabilidad del controlador:
/// traducir errores del dominio al protocolo HTTP. Application e Infrastructure
/// no deben conocer los códigos HTTP.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IIdentityService _identityService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IIdentityService identityService, ILogger<AuthController> logger)
    {
        _identityService = identityService;
        _logger = logger;
    }

    /// <summary>
    /// Registra un nuevo comercio (tenant) y su usuario administrador inicial.
    /// Retorna un JWT listo para usar si el registro fue exitoso.
    /// </summary>
    /// <response code="201">Registro exitoso. Incluye el token JWT.</response>
    /// <response code="409">El RUC/CUIT o email ya existe en la plataforma.</response>
    /// <response code="400">Los datos de entrada son inválidos.</response>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponseDto>> Register(
        [FromBody] RegistrarTenantDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await _identityService.RegistrarTenantAsync(dto, cancellationToken);

            _logger.LogInformation(
                "Nuevo tenant registrado: {NombreEmpresa} (TenantId: {TenantId})",
                response.NombreEmpresa, response.TenantId);

            // 201 Created con Location header apuntando al recurso creado
            return StatusCode(StatusCodes.Status201Created, response);
        }
        catch (InvalidOperationException ex)
        {
            // Conflicto de negocio: RUC o email duplicado
            return Conflict(new ProblemDetails
            {
                Title = "Conflicto en el registro",
                Detail = ex.Message,
                Status = StatusCodes.Status409Conflict
            });
        }
    }

    /// <summary>
    /// Autentica un usuario existente y retorna un JWT.
    /// </summary>
    /// <response code="200">Login exitoso. Incluye el token JWT.</response>
    /// <response code="401">Credenciales inválidas o cuenta suspendida.</response>
    [HttpPost("register-tenant")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponseDto>> RegisterTenant(
        [FromBody] RegisterComercioDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var registrarDto = new RegistrarTenantDto(
                NombreEmpresa: dto.NombreComercio,
                RucCuit: "N/A",
                AdminNombre: dto.AdminEmail.Split('@')[0],
                AdminEmail: dto.AdminEmail,
                AdminPassword: dto.AdminPassword
            );

            var response = await _identityService.RegistrarTenantAsync(registrarDto, cancellationToken);

            _logger.LogInformation(
                "Nuevo comercio registrado via portal: {NombreComercio} (TenantId: {TenantId})",
                response.NombreEmpresa, response.TenantId);

            return StatusCode(StatusCodes.Status201Created, response);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Conflicto en el registro",
                Detail = ex.Message,
                Status = StatusCodes.Status409Conflict
            });
        }
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Login(
        [FromBody] LoginDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await _identityService.LoginAsync(dto, cancellationToken);

            _logger.LogInformation(
                "Login exitoso para {Email} (TenantId: {TenantId})",
                response.Email, response.TenantId);

            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            // No loguear el mensaje completo en producción para evitar fuga de info
            _logger.LogWarning("Intento de login fallido para email: {Email}", dto.Email);

            return Unauthorized(new ProblemDetails
            {
                Title = "Autenticación fallida",
                Detail = ex.Message,
                Status = StatusCodes.Status401Unauthorized
            });
        }
    }

    /// <summary>
    /// Endpoint de prueba para verificar que el token JWT es válido.
    /// Retorna los datos del usuario autenticado extraídos de sus claims.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult Me()
    {
        var claims = User.Claims.Select(c => new { c.Type, c.Value });
        return Ok(new
        {
            Mensaje = "Token válido",
            Usuario = User.Identity?.Name,
            Claims = claims
        });
    }
}
