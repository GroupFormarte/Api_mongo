/**
 * @swagger
 * tags:
 *   name: Version
 *   description: Versión de la aplicación móvil (público)
 */

/**
 * @swagger
 * /api/version/:
 *   get:
 *     summary: Obtener versión actual de la app
 *     description: Consulta la versión actual de la aplicación móvil registrada en la base de datos.
 *     tags: [Version]
 *     responses:
 *       200:
 *         description: Versión actual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 buildNumber:
 *                   type: string
 *                   example: "100"
 *                 releaseDate:
 *                   type: string
 *                   format: date-time
 *                 forceUpdate:
 *                   type: boolean
 *                   example: false
 *                 updateMessage:
 *                   type: string
 *                   nullable: true
 *       404:
 *         description: Versión no encontrada en la base de datos
 *   post:
 *     summary: Crear versión (primera vez)
 *     description: Registra la versión inicial de la aplicación. Falla si ya existe una versión.
 *     tags: [Version]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [data]
 *             properties:
 *               data:
 *                 type: object
 *                 required: [version, buildNumber]
 *                 properties:
 *                   version:
 *                     type: string
 *                     example: "1.0.0"
 *                   buildNumber:
 *                     type: string
 *                     example: "100"
 *                   releaseDate:
 *                     type: string
 *                     format: date-time
 *                   forceUpdate:
 *                     type: boolean
 *                     default: false
 *                   updateMessage:
 *                     type: string
 *                     nullable: true
 *     responses:
 *       201:
 *         description: Versión creada exitosamente
 *       400:
 *         description: La versión ya existe o datos inválidos
 *   put:
 *     summary: Actualizar versión de la app
 *     description: Actualiza la versión existente. Usar para forzar actualizaciones en clientes.
 *     tags: [Version]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [version, buildNumber]
 *             properties:
 *               version:
 *                 type: string
 *                 example: "1.0.1"
 *               buildNumber:
 *                 type: string
 *                 example: "101"
 *               releaseDate:
 *                 type: string
 *                 format: date-time
 *               forceUpdate:
 *                 type: boolean
 *                 example: true
 *               updateMessage:
 *                 type: string
 *                 example: "Actualización importante de seguridad"
 *     responses:
 *       200:
 *         description: Versión actualizada exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: No hay versión para actualizar
 */

export {};
