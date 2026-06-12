using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JujuyERP.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Tenants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    NombreEmpresa = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    RucCuit = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    PlanActivo = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "datetime('now')"),
                    ModulosActivosConfig = table.Column<string>(type: "TEXT", nullable: false, defaultValue: "{}"),
                    Activo = table.Column<bool>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPor = table.Column<string>(type: "TEXT", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPor = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tenants", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Productos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    TenantId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CodigoBarras = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 300, nullable: false),
                    Descripcion = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    PrecioVenta = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    Costo = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    StockActual = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    StockMinimo = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    Activo = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPor = table.Column<string>(type: "TEXT", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPor = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Productos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Productos_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    TenantId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", maxLength: 60, nullable: false),
                    Rol = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Activo = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPor = table.Column<string>(type: "TEXT", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPor = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Usuarios_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Productos_TenantId_CodigoBarras",
                table: "Productos",
                columns: new[] { "TenantId", "CodigoBarras" },
                unique: true,
                filter: "\"CodigoBarras\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_RucCuit",
                table: "Tenants",
                column: "RucCuit",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_TenantId_Email",
                table: "Usuarios",
                columns: new[] { "TenantId", "Email" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Productos");

            migrationBuilder.DropTable(
                name: "Usuarios");

            migrationBuilder.DropTable(
                name: "Tenants");
        }
    }
}
