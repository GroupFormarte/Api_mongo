/**
 * @swagger
 * tags:
 *   name: PDF
 *   description: Generación y previsualización de reportes PDF (requiere autenticación)
 */

/**
 * @swagger
 * /api/pdf/generate:
 *   post:
 *     summary: Generar reporte PDF
 *     description: Genera un reporte PDF con los datos del estudiante y lo retorna como archivo binario.
 *     tags: [PDF]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               evaluacion:
 *                 type: string
 *                 example: "ASIT"
 *               nombre:
 *                 type: string
 *                 example: "Juan Pérez"
 *               codigo:
 *                 type: string
 *                 example: "1112049372"
 *               institucion:
 *                 type: string
 *                 example: "FORMARTE MEDELLÍN"
 *               grupo:
 *                 type: string
 *                 example: "UDEA G-1"
 *               puntaje:
 *                 type: number
 *                 example: 450.5
 *               areas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     nombre:
 *                       type: string
 *                     correctas:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     puntaje:
 *                       type: number
 *     responses:
 *       200:
 *         description: PDF generado exitosamente
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/pdf/preview:
 *   get:
 *     summary: Previsualizar reporte en HTML
 *     description: Renderiza la plantilla EJS del reporte en HTML para previsualización en el navegador.
 *     tags: [PDF]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: HTML del reporte renderizado
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       401:
 *         description: No autorizado
 */

export {};
