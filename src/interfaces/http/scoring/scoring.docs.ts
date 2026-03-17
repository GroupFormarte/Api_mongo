/**
 * @swagger
 * tags:
 *   name: Scoring
 *   description: Cálculo de puntajes Saber11, UNAL y UDEA (público)
 */

/**
 * @swagger
 * /api/scoring/udea/calcular:
 *   post:
 *     summary: Calcular puntaje UDEA
 *     description: >
 *       Calcula el puntaje UDEA Semi-IRT recibiendo los subjects directamente.
 *       Las áreas son: Matemáticas, Lectura Crítica, Ciencias Sociales, Ciencias Naturales, Inglés.
 *     tags: [Scoring]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idEstudiante, idInstituto, subjects]
 *             properties:
 *               idEstudiante:
 *                 type: string
 *                 example: "est-001"
 *               idInstituto:
 *                 type: string
 *                 example: "inst-001"
 *               idSimulacro:
 *                 type: string
 *                 description: Opcional
 *               subjects:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Matemáticas"
 *                     correctAnswers:
 *                       type: integer
 *                       example: 17
 *                     incorrectAnswers:
 *                       type: integer
 *                       example: 33
 *     responses:
 *       200:
 *         description: Puntaje UDEA calculado
 *       400:
 *         description: Datos inválidos
 */

/**
 * @swagger
 * /api/scoring/unal/calcular-batch:
 *   post:
 *     summary: Calcular puntajes UNAL en lote
 *     description: >
 *       Calcula puntajes UNAL para un grupo de estudiantes.
 *       Áreas: 0–15 (escala UNAL). Global: 0–1000 (media=500, SD=100).
 *     tags: [Scoring]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idInstituto, idSimulacro, estudiantes]
 *             properties:
 *               idInstituto:
 *                 type: string
 *               idSimulacro:
 *                 type: string
 *               estudiantes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     idEstudiante:
 *                       type: string
 *                     subjects:
 *                       type: array
 *                       items:
 *                         type: object
 *     responses:
 *       200:
 *         description: Puntajes UNAL calculados
 *       400:
 *         description: Datos inválidos
 */

/**
 * @swagger
 * /api/scoring/saber11/calcular-batch:
 *   post:
 *     summary: Calcular puntajes Saber 11 en lote
 *     description: Calcula puntajes Saber 11 para un grupo de estudiantes.
 *     tags: [Scoring]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idInstituto, idSimulacro, estudiantes]
 *             properties:
 *               idInstituto:
 *                 type: string
 *               idSimulacro:
 *                 type: string
 *               estudiantes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     idEstudiante:
 *                       type: string
 *                     subjects:
 *                       type: array
 *                       items:
 *                         type: object
 *     responses:
 *       200:
 *         description: Puntajes Saber 11 calculados
 *       400:
 *         description: Datos inválidos
 */

/**
 * @swagger
 * /api/scoring/saber11/guardar-respuestas:
 *   post:
 *     summary: Guardar respuestas individuales Saber 11
 *     description: >
 *       Recibe respuestas individuales por pregunta y las guarda en resultados_preguntas.
 *       Llamado en background desde Flutter — no bloquea la calificación.
 *     tags: [Scoring]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idInstituto, idSimulacro, estudiantes]
 *             properties:
 *               idInstituto:
 *                 type: string
 *               idSimulacro:
 *                 type: string
 *               estudiantes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     idEstudiante:
 *                       type: string
 *                     answers:
 *                       type: array
 *                       items:
 *                         type: object
 *     responses:
 *       200:
 *         description: Respuestas guardadas
 *       400:
 *         description: Datos inválidos
 */

/**
 * @swagger
 * /api/scoring/recalibrar:
 *   post:
 *     summary: Recalibrar scoring
 *     description: >
 *       Recalcula `difficulty` y `weight` en `contadores_preguntas`
 *       usando todos los datos actuales de `resultados_preguntas`.
 *     tags: [Scoring]
 *     responses:
 *       200:
 *         description: Recalibración completada
 */

export {};
