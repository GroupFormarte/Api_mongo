/**
 * @swagger
 * tags:
 *   name: System
 *   description: CRUD genérico sobre colecciones MongoDB y utilidades del sistema (requiere autenticación)
 */

/**
 * @swagger
 * /api/system/{collectionName}/bulk:
 *   post:
 *     summary: Obtener documentos por IDs en masa
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre de la colección MongoDB
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Documentos encontrados
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/system/{collectionName}/search/{field}/{value}:
 *   get:
 *     summary: Buscar documentos por campo dinámico
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: field
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del campo a filtrar
 *         example: "grado"
 *       - in: path
 *         name: value
 *         required: true
 *         schema:
 *           type: string
 *         description: Valor a buscar
 *         example: "11"
 *     responses:
 *       200:
 *         description: Documentos encontrados
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/system/{collectionName}/multi-search/{query}:
 *   get:
 *     summary: Búsqueda multi-campo
 *     description: Busca el query en múltiples campos del documento.
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/system/{collectionName}/category/{category}:
 *   get:
 *     summary: Buscar documentos por categoría
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Documentos encontrados
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/system/{collectionName}:
 *   get:
 *     summary: Obtener todos los documentos de una colección
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de documentos
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/system/{collectionName}/{id}:
 *   get:
 *     summary: Obtener documento por ID
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Documento encontrado
 *       404:
 *         description: No encontrado
 *       401:
 *         description: No autorizado
 *   put:
 *     summary: Reemplazar documento por ID (full update)
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Documento actualizado
 *       404:
 *         description: No encontrado
 *       401:
 *         description: No autorizado
 *   patch:
 *     summary: Actualización parcial de documento por ID
 *     description: Solo actualiza los campos especificados, sin tocar el resto.
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Documento actualizado parcialmente
 *       404:
 *         description: No encontrado
 *       401:
 *         description: No autorizado
 *   delete:
 *     summary: Eliminar documento por ID
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Documento eliminado
 *       404:
 *         description: No encontrado
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/system/assigned_simulation/{id}/simulacro/{simulacroId}/resultados:
 *   patch:
 *     summary: Actualizar resultados de simulacro asignado
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del assigned_simulation
 *       - in: path
 *         name: simulacroId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Resultados actualizados
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/system/assigned_simulation/{id}/simulacro/{simulacroId}/session-details:
 *   patch:
 *     summary: Actualizar detalles de sesión de simulacro asignado
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: simulacroId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Detalles de sesión actualizados
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/system/assigned_simulation/{documentId}/simulacro/{simulacroId}/student/{userId}:
 *   patch:
 *     summary: Actualizar o crear respuestas de estudiante en simulacro
 *     description: >
 *       Si el estudiante no existe, lo crea con todos los datos.
 *       Si ya existe, solo actualiza sectionOne/sectionTwo sin sobreescribir otros campos.
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: simulacroId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: JSON plano con datos del estudiante y sus respuestas mezclados
 *     responses:
 *       200:
 *         description: Respuestas actualizadas o creadas
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/system/system/cache/stats:
 *   get:
 *     summary: Estadísticas del caché
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas del caché de modelos
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/system/system/collections/{collectionName}/stats:
 *   get:
 *     summary: Estadísticas de una colección
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estadísticas de la colección
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/system/system/cache/{collectionName}:
 *   delete:
 *     summary: Limpiar caché
 *     description: Limpia el caché de una colección específica, o todo el caché si no se especifica.
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: false
 *         schema:
 *           type: string
 *         description: Colección a limpiar (opcional - si se omite limpia todo)
 *     responses:
 *       200:
 *         description: Caché limpiado
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/system/system/cache/preload:
 *   post:
 *     summary: Precargar modelos en caché
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Modelos precargados exitosamente
 *       401:
 *         description: No autorizado
 */

export {};
