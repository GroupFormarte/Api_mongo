# FormarTE API

Backend en Node.js + TypeScript + Express + MongoDB para operaciones academicas, autenticacion, scoring, archivos y reportes.

## Estado Actual del Proyecto

- Entrada de desarrollo: `src/main/server.ts`
- Registro de rutas HTTP: `src/interfaces/http/index.ts`
- WebSocket: `/ws/notifications`
- Base path API: `/api/*`

## Estructura Minima Relevante

```
src/
  main/
    server.ts
    setupMiddlewares.ts
  interfaces/
    http/
      index.ts
      auth/
      academic/
      students/
      system/
      media/
      pdf/
      qualifier/
      time/
      scoring/
      progress/
    websocket/
  application/services/
  infrastructure/
  shared/
storage/
  templates/
  uploads/
```

## Requisitos

- Node.js 20+
- npm
- MongoDB accesible por `MONGO_URI`

## Configuracion

Crear `.env` (si no existe):

```bash
copy .env.example .env
```

Variables clave:

```env
PORT=3000
NODE_ENV=development
MONGO_URI=<tu-uri-mongodb>
PODIUM_API_URL:<url-podium>
JWT_SECRET=<tu-secret>
JWT_EXPIRES_IN=24h
UPLOAD_PATH=./storage/uploads
MAX_FILE_SIZE=10485760
```

## Scripts

```bash
npm run dev       # ts-node-dev --respawn --transpile-only src/main/server.ts
npm run build     # tsc -p .
npm start         # node build/main/server.js
npm test
```

## Flujo de Arranque

1. Carga middlewares generales
2. Registra fallback para uploads no encontrados
3. Registra rutas HTTP
4. Configura manejo de errores global
5. Levanta HTTP + WebSocket
6. Conecta a MongoDB
7. Inicia tracking de posiciones

## Documentacion API

Ver `FORMARTE_API_GUIDE.md` para endpoints por modulo, ejemplos y convenciones de request/response.

## Troubleshooting Rapido

- Error `ECONNREFUSED 127.0.0.1:27017`:
  `MONGO_URI` apunta a localhost sin MongoDB activo. Configura una URI valida (local o remota) en `.env`.
- Error `Cannot find module ...` en rutas:
  revisar imports relativos dentro de `src/interfaces/http/*` despues de mover archivos.
