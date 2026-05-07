# Frontend Despacho - Innovatech Chile

Aplicación web desarrollada en React + Vite para gestionar despachos y ventas de productos.

## Tecnologías
- React 18
- Vite
- Tailwind CSS
- Axios
- Docker (multi-stage build con Nginx)
- GitHub Actions (CI/CD)

## Requisitos
- Docker Desktop
- Docker Compose

## Variables de entorno
| Variable | Descripción | Ejemplo |
|---|---|---|
| VITE_API_URL_VENTAS | URL del backend de ventas | http://localhost:8080 |
| VITE_API_URL_DESPACHOS | URL del backend de despachos | http://localhost:8081 |

## Cómo ejecutar localmente

1. Clonar el repositorio:
```bash
git clone https://github.com/AAagustinnn/frontend-despacho.git
cd frontend-despacho
```

2. Crear archivo `.env`:
```bash
VITE_API_URL_VENTAS=http://localhost:8080
VITE_API_URL_DESPACHOS=http://localhost:8081
```

3. Levantar el contenedor:
```bash
docker compose up --build
```

4. Verificar que funciona:
http://localhost:80

## Pipeline CI/CD
El pipeline se activa automáticamente al hacer push en la rama `deploy`:
- Build de la imagen Docker con variables de entorno
- Push a Docker Hub
- Despliegue automático en EC2-Frontend

## Funcionalidades
- Consultar órdenes de compra pendientes de despacho
- Generar nuevos despachos
- Consultar órdenes de despacho existentes
- Cerrar despachos entregados