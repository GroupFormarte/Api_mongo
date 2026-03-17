/**
 * @swagger
 * tags:
 *   name: Qualifier
 *   description: Carga de archivos para calificación (requiere autenticación)
 */

/**
 * @swagger
 * /api/qualifier/upload:
 *   post:
 *     summary: Subir archivo para calificación
 *     description: Recibe un archivo (multipart) y lo procesa para calificación.
 *     tags: [Qualifier]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo a calificar
 *     responses:
 *       200:
 *         description: Archivo procesado exitosamente
 *       400:
 *         description: Archivo inválido o no proporcionado
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/qualifier/excel:
 *   post:
 *     summary: Subir archivo Excel para calificación
 *     description: Recibe un archivo Excel (multipart) y lo procesa para calificación masiva.
 *     tags: [Qualifier]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo Excel (.xlsx) con datos de calificación
 *     responses:
 *       200:
 *         description: Excel procesado exitosamente
 *       400:
 *         description: Archivo inválido o formato incorrecto
 *       401:
 *         description: No autorizado
 */

export {};
