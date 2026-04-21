# FormarTE API Guide (Flujo Actual)

Este documento resume solo lo esencial del estado actual de la API.

## 1. Convenciones Generales

- Base URL local: `http://localhost:3000`
- Formato auth: `Authorization: Bearer <token>`
- Contenido JSON: `Content-Type: application/json`
- Respuestas: utilidades de `ApiResponse` en la mayoria de modulos

## 2. Seguridad y Sesion

Publico (sin `authenticate`):

- `/api/auth/*`
- `/api/version/*`
- `/api/scoring/*`

Protegido (con `authenticate`):

- `/api/academic/*`
- `/api/students/*`
- `/api/system/*`
- `/api/media/*`
- `/api/pdf/*`
- `/api/qualifier/*`
- `/api/time/*`
- `/progress-app/*`

Legacy:

- `/simulacro/*`

## 3. Endpoints por Modulo

### 3.1 Auth (`/api/auth`)

- `POST /register`
- `POST /login`
- `POST /podium-login`
- `POST /refresh-token`
- `POST /logout`
- `POST /logout-all` (requiere auth)

### 3.2 Version (`/api/version`)

- `GET /`
- `POST /`
- `PUT /`

### 3.3 Scoring (`/api/scoring`)

- `POST /udea/calcular`
- `POST /unal/calcular-batch`
- `POST /saber11/calcular-batch`
- `POST /saber11/guardar-respuestas`
- `POST /recalibrar`

### 3.4 Academic (`/api/academic`)

- `POST /areas/bulk`
- `POST /get-areas/bulk` (compatibilidad)
- `POST /subjects/bulk`
- `GET /subjects/:idAsignature/:valueGrado`
- `GET /simulacro/:value/:cantidad`
- `GET /generate-simulacro/:value/:cantidad` (alias)
- `GET /questions/:idquestion/:idProgram?`
- `GET /questions-by-type/:idPrograma/:type/:value`
- `GET /preguntas-por-tipo/:idPrograma/:type/:value` (compatibilidad)
- `GET /academic-level/:collectionName/:id/:score`

### 3.5 Students (`/api/students`)

- `GET /` (lista o por query `id_estudiante`)
- `GET /position/:grado/:id_student`
- `GET /get-my-position/:grado/:id_student` (compatibilidad)
- `PUT /bulk-update`
- `POST /bulk-create-unique`
- `POST /remove-examen`
- `GET /:collectionName/convert_id/:id`
- `GET /:collectionName/by-student-id/:id`
- `GET /:collectionName/:id`
- `GET /:collectionName`
- `POST /:collectionName/:id?`
- `PUT /:id`
- `PUT /:collectionName/:id`
- `DELETE /:collectionName/:id`
- `GET /search/:field/:value`

### 3.6 System (`/api/system`)

CRUD dinamico:

- `POST /:collectionName/bulk`
- `GET /:collectionName/search/:field/:value`
- `GET /:collectionName/multi-search/:query`
- `GET /:collectionName/category/:category`
- `GET /:collectionName`
- `GET /:collectionName/:id`
- `POST /:collectionName/:id?`
- `PUT /:collectionName/:id`
- `PATCH /:collectionName/:id`
- `DELETE /:collectionName/:id`

Assigned simulation:

- `PATCH /assigned_simulation/:id/simulacro/:simulacroId/resultados`
- `PATCH /assigned_simulation/:id/simulacro/:simulacroId/session-details`
- `PATCH /assigned_simulation/:documentId/simulacro/:simulacroId/student/:userId`

Cache/modelos:

- `GET /system/cache/stats`
- `GET /system/collections/:collectionName/stats`
- `DELETE /system/cache/:collectionName?`
- `POST /system/cache/preload`

### 3.7 Media (`/api/media`)

- `POST /images/upload`
- `POST /images/upload-multiple`
- `GET /images/proxy` (placeholder 501)
- `GET /images/:id/metadata`
- `DELETE /images/:id`
- `POST /files/upload` (placeholder)
- `GET /files/download/:id` (placeholder)
- `GET /stats` (placeholder)
- `POST /cleanup` (placeholder)

### 3.8 PDF (`/api/pdf`)

- `POST /generate`
- `GET /preview` (render de template de reporte)

### 3.9 Qualifier (`/api/qualifier`)

- `POST /upload` (multipart, field `file`)
- `POST /excel` (multipart, field `file`)

### 3.10 Time (`/api/time`)

- `GET /current-time`
- `POST /time-left`

### 3.11 Progress (`/progress-app`)

- `GET /analisis/global/:idGrado/:idInstituto`
- `GET /analisis/asignaturas/:idEstudiante/:idGrado/:idInstituto`
- `GET /analisis/posiciones/:idGrado/:idInstituto`

### 3.12 Legacy Simulacro (`/simulacro`)

Modulo legacy con CRUD y operaciones historicas para compatibilidad movil.

## 4. Ejemplos Minimos

Login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456"}'
```

Ruta protegida:

```bash
curl -X GET http://localhost:3000/api/system/system/cache/stats \
  -H "Authorization: Bearer <token>"
```

Upload archivo (qualifier):

```bash
curl -X POST http://localhost:3000/api/qualifier/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@./archivo.xlsx"
```

## 5. Notas Operativas

- Si falla el arranque por MongoDB, revisar `MONGO_URI` en `.env`.
- Varios endpoints en `media` son placeholders y responden datos simulados o `501`.
- Para cambios de rutas, actualizar primero `src/presentation/http/index.ts` y luego esta guia.
