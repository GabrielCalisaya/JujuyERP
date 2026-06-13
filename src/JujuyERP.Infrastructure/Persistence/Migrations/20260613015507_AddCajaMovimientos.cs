using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JujuyERP.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCajaMovimientos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CajaMovimientos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    TenantId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Fecha = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Tipo = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    MetodoPago = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    Monto = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    Concepto = table.Column<string>(type: "TEXT", maxLength: 300, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CajaMovimientos", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CajaMovimientos");
        }
    }
}
