# JujuyERP

Sistema de gestión en desarrollo con backend **ASP.NET Core Web API** y frontend **Angular**. El proyecto modela una arquitectura por capas y cubre funcionalidades de autenticación, productos, ventas, caja y métricas de dashboard.

## Stack

- **Backend:** C#, .NET 9, ASP.NET Core Web API, Entity Framework Core, SQLite, JWT, Swagger y MediatR.
- **Frontend:** Angular 21, TypeScript, Tailwind CSS y service worker.
- **Arquitectura:** capas separadas de `Domain`, `Application`, `Infrastructure` y `WebAPI`.

## Estructura

```text
JujuyERP.sln
├── src/
│   ├── JujuyERP.Domain/          # Entidades y reglas de dominio
│   ├── JujuyERP.Application/     # Casos de uso, comandos y consultas
│   ├── JujuyERP.Infrastructure/  # Persistencia e implementaciones técnicas
│   └── JujuyERP.WebAPI/           # API REST, autenticación y Swagger
└── client/                        # Aplicación Angular
```

## Requisitos

- .NET SDK 9
- Node.js 20 o superior
- npm 11 o superior

## Ejecución local

### API

```bash
dotnet restore
dotnet run --project src/JujuyERP.WebAPI
```

En desarrollo, Swagger queda disponible en la URL que informa la aplicación al iniciar.

### Cliente

```bash
cd client
npm install
npm start
```

El cliente se sirve por defecto en `http://localhost:4200`.

## Configuración

La API usa SQLite para desarrollo local. Antes de desplegar, configurá una clave JWT segura y los orígenes permitidos mediante la configuración de cada entorno. No se versionan bases de datos ni artefactos de compilación.

## Estado del proyecto

Proyecto en desarrollo, orientado a consolidar un sistema de gestión con una API REST y una interfaz web desacoplada.
