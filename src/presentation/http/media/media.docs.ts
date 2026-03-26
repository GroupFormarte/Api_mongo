/**
 * @swagger
 * tags:
 *   name: Media
 *   description: Gestión de imágenes y archivos (requiere autenticación)
 */

/**
 * @swagger
 * /api/media/images/upload:
 *   post:
 *     summary: Subir imagen
 *     description: Sube una imagen al servidor. Usar multipart/form-data.
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Imagen subida exitosamente
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/media/images/upload-multiple:
 *   post:
 *     summary: Subir múltiples imágenes
 *     description: Sube varias imágenes en una sola petición. Usar multipart/form-data.
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Imágenes subidas exitosamente
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/media/images/proxy:
 *   get:
 *     summary: Proxy de imagen (resize, optimize)
 *     description: Proxy para optimizar/redimensionar imágenes. No implementado aún.
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       501:
 *         description: No implementado
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/media/images/{id}/metadata:
 *   get:
 *     summary: Obtener metadata de imagen
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la imagen
 *     responses:
 *       200:
 *         description: Metadata de la imagen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 filename:
 *                   type: string
 *                 size:
 *                   type: integer
 *                 mimeType:
 *                   type: string
 *                 uploadDate:
 *                   type: string
 *                   format: date-time
 *                 dimensions:
 *                   type: object
 *                   properties:
 *                     width:
 *                       type: integer
 *                     height:
 *                       type: integer
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/media/images/{id}:
 *   delete:
 *     summary: Eliminar imagen
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Imagen eliminada
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/media/files/upload:
 *   post:
 *     summary: Subir archivo genérico
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Archivo subido exitosamente
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/media/files/download/{id}:
 *   get:
 *     summary: Obtener URL de descarga de archivo
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: URL de descarga generada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 downloadUrl:
 *                   type: string
 *                 filename:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/media/stats:
 *   get:
 *     summary: Estadísticas de almacenamiento de media
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de imágenes y archivos
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/media/cleanup:
 *   post:
 *     summary: Limpiar archivos sin usar
 *     description: Elimina archivos que no están referenciados en ningún documento.
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Limpieza completada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 filesDeleted:
 *                   type: integer
 *                 spaceFreed:
 *                   type: integer
 *                 duration:
 *                   type: integer
 *       401:
 *         description: No autorizado
 */

export {};
