# FormArte API - Ejemplos de Uso de Autenticación

## Tabla de Contenidos
1. [Autenticación Estándar (Email/Password)](#autenticación-estándar-emailpassword)
2. [Autenticación con Podium](#autenticación-con-podium)
3. [Uso de Tokens con Validación de IP](#uso-de-tokens-con-validación-de-ip)
4. [Refrescar Token](#refrescar-token)
5. [Cerrar Sesión](#cerrar-sesión)
6. [Rutas Protegidas](#rutas-protegidas)

---

## Autenticación Estándar (Email/Password)

### 1. Registro de Usuario

**Endpoint:** `POST /api/auth/register`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "type_id": 1,
    "number_id": "1234567890",
    "name": "Juan",
    "second_name": "Carlos",
    "last_name": "Pérez",
    "second_last": "García",
    "email": "juan.perez@example.com",
    "password": "miPassword123",
    "cellphone": "+573001234567",
    "locate_district": "Bogotá",
    "type_user": "Student",
    "gender": "M",
    "programa": "Ingeniería",
    "birthday": "1995-05-15"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "type_id": 1,
      "number_id": "1234567890",
      "name": "Juan",
      "email": "juan.perez@example.com",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  }
}
```

---

### 2. Login Estándar

**Endpoint:** `POST /api/auth/login`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@example.com",
    "password": "miPassword123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "type_id": 1,
      "number_id": "1234567890",
      "name": "Juan",
      "email": "juan.perez@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Nota importante:**
- El sistema captura automáticamente tu **IP** y **User-Agent**
- El token queda vinculado a tu IP actual
- Si intentas usar el token desde otra IP, será rechazado

---

## Autenticación con Podium

### 3. Login con Podium API

**Endpoint:** `POST /api/auth/podium-login`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/podium-login \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "12345",
    "podiumToken": "podium_token_abc123xyz..."
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Podium login successful",
  "data": {
    "userData": {
      "id": "12345",
      "email": "user@podium.com",
      "name": "Usuario Podium"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Flujo:**
1. El backend valida `podiumToken` contra `https://stage-api.plataformapodium.com/api/user/{userId}`
2. Si es válido, genera un JWT interno de FormArte
3. Crea una sesión vinculada a tu IP
4. Retorna el nuevo token

---

## Uso de Tokens con Validación de IP

### 4. Acceder a Ruta Protegida

**Endpoint:** `GET /api/students/ranking` (ejemplo)

**Request desde la MISMA IP donde hiciste login:**
```bash
curl -X GET http://localhost:3000/api/students/ranking \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

**Request desde una IP DIFERENTE:**
```bash
curl -X GET http://localhost:3000/api/students/ranking \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": false,
  "message": "Invalid session",
  "error": "Session expired, invalid, or IP mismatch detected"
}
```

**¿Qué pasó?**
- El middleware detectó que tu IP actual (ej: `192.168.1.100`) no coincide con la IP registrada en la sesión (ej: `192.168.1.50`)
- Por seguridad, rechaza la petición con `401 Unauthorized`

---

## Refrescar Token

### 5. Refrescar Token (cuando está próximo a expirar)

**Endpoint:** `POST /api/auth/refresh-token`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/refresh-token \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (si el token necesita renovación):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_TOKEN..."
  }
}
```

**Response (si aún no necesita renovación):**
```json
{
  "success": false,
  "message": "Token does not need refresh yet"
}
```

**Notas:**
- Solo se renueva si quedan menos de 2 horas de expiración
- La sesión antigua se invalida automáticamente
- Se crea una nueva sesión con el token renovado (vinculada a tu IP actual)

---

## Cerrar Sesión

### 6. Logout (cerrar sesión actual)

**Endpoint:** `POST /api/auth/logout`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 7. Logout de todas las sesiones

**Endpoint:** `POST /api/auth/logout-all`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/logout-all \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "message": "3 session(s) invalidated successfully",
  "data": {
    "sessionsInvalidated": 3
  }
}
```

**Uso:**
- Útil si sospechas que tu cuenta fue comprometida
- Invalida TODAS tus sesiones activas en todos los dispositivos
- Tendrás que volver a hacer login

---

## Rutas Protegidas

### 8. Cómo proteger tus propias rutas

Para agregar validación de IP + sesión a cualquier endpoint:

```typescript
import { authenticate } from '../../../shared/middleware/authMiddleware';

// Ruta protegida
router.get('/mi-ruta-segura', authenticate, miControlador);
```

El middleware `authenticate` automáticamente:
1. Valida el token JWT
2. Verifica que la sesión esté activa
3. Compara la IP actual con la IP de la sesión
4. Rechaza si hay discrepancia

---

## Ejemplos Completos de Flujo

### Flujo Típico 1: Login Estándar

```bash
# 1. Login desde tu casa (IP: 192.168.1.50)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "pass123"}'

# Recibes: token = "abc123..."

# 2. Usar token desde la MISMA IP (OK)
curl -X GET http://localhost:3000/api/students/ranking \
  -H "Authorization: Bearer abc123..."
# ✅ Success!

# 3. Intentar usar token desde la oficina (IP: 200.100.50.10)
curl -X GET http://localhost:3000/api/students/ranking \
  -H "Authorization: Bearer abc123..."
# ❌ Error: "IP mismatch detected"
```

---

### Flujo Típico 2: Login con Podium

```bash
# 1. Login via Podium
curl -X POST http://localhost:3000/api/auth/podium-login \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "12345",
    "podiumToken": "podium_token_xyz"
  }'

# Recibes: token = "def456..." (token de FormArte, NO el de Podium)

# 2. Usar token de FormArte
curl -X GET http://localhost:3000/api/academic/simulacros \
  -H "Authorization: Bearer def456..."
# ✅ Success!

# 3. Refrescar antes de que expire
curl -X POST http://localhost:3000/api/auth/refresh-token \
  -H "Authorization: Bearer def456..."
# Recibes nuevo token: "ghi789..."
```

---

## Códigos de Error Comunes

| Código | Mensaje | Causa |
|--------|---------|-------|
| 401 | No token provided | Falta header `Authorization: Bearer {token}` |
| 401 | Invalid token | Token expirado o malformado |
| 401 | IP mismatch detected | Estás usando el token desde otra IP |
| 401 | Session expired | La sesión ya no está activa |
| 400 | Email and password are required | Faltan campos en login |
| 400 | userId and podiumToken are required | Faltan campos en Podium login |

---

## Seguridad Implementada

✅ **Validación de IP por sesión**
✅ **Tokens JWT firmados con secret**
✅ **Sesiones expiran en 24 horas**
✅ **Auto-limpieza de sesiones expiradas (MongoDB TTL)**
✅ **Logout individual y masivo**
✅ **Soporte para múltiples métodos de autenticación**
✅ **Refresh token para renovación segura**

---

## Variables de Entorno Necesarias

```env
JWT_SECRET=tu-super-secreto-aqui-cambiar-en-produccion
MONGO_URI=mongodb://localhost:27017/formarte_db
PORT=3000
```

---

## Notas Adicionales

- Los tokens Podium son validados contra `https://stage-api.plataformapodium.com`
- La IP se extrae de headers `x-forwarded-for` o `x-real-ip` (compatible con proxies)
- Las sesiones se almacenan en la colección `sessions` de MongoDB
- MongoDB elimina automáticamente sesiones expiradas (TTL index)

---

**¿Preguntas?** Revisa los logs del servidor para debugging detallado de autenticaciones.
