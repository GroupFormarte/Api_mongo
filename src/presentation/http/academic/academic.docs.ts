/**
 * @swagger
 * tags:
 *   name: Academic
 *   description: Áreas, asignaturas, preguntas y simulacros académicos (requiere autenticación)
 */

/**
 * @swagger
 * /api/academic/areas/bulk:
 *   post:
 *     summary: Obtener áreas por IDs (masivo)
 *     description: Trae varias áreas de un grado en una sola consulta.
 *     tags: [Academic]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grado, ids]
 *             properties:
 *               grado:
 *                 type: string
 *                 example: "11"
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["area1", "area2"]
 *     responses:
 *       200:
 *         description: Áreas encontradas
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/academic/get-areas/bulk:
 *   post:
 *     summary: Obtener áreas por IDs (compatibilidad)
 *     description: Alias de /areas/bulk para compatibilidad con clientes anteriores.
 *     tags: [Academic]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grado, ids]
 *             properties:
 *               grado:
 *                 type: string
 *                 example: "11"
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Áreas encontradas
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/academic/subjects/bulk:
 *   post:
 *     summary: Obtener asignaturas por IDs (masivo)
 *     description: Trae varias asignaturas de un grado en una sola consulta.
 *     tags: [Academic]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grado, ids]
 *             properties:
 *               grado:
 *                 type: string
 *                 example: "11"
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Asignaturas encontradas
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/academic/generate-simulacro/{value}/{cantidad}:
 *   get:
 *     summary: Generar simulacro (alias)
 *     description: Arma un simulacro con preguntas según grado/valor y cantidad. Alias de /simulacro.
 *     tags: [Academic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: value
 *         required: true
 *         schema:
 *           type: string
 *         description: Valor/grado del simulacro
 *         example: "11"
 *       - in: path
 *         name: cantidad
 *         required: true
 *         schema:
 *           type: integer
 *         description: Número de preguntas
 *         example: 30
 *     responses:
 *       200:
 *         description: Simulacro generado exitosamente
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/academic/simulacro/{value}/{cantidad}:
 *   get:
 *     summary: Generar simulacro (ruta principal)
 *     description: Construye un simulacro con la cantidad de preguntas solicitada.
 *     tags: [Academic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: value
 *         required: true
 *         schema:
 *           type: string
 *         example: "11"
 *       - in: path
 *         name: cantidad
 *         required: true
 *         schema:
 *           type: integer
 *         example: 30
 *     responses:
 *       200:
 *         description: Simulacro generado exitosamente
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/academic/subjects/{idAsignature}/{valueGrado}:
 *   get:
 *     summary: Obtener asignatura por ID
 *     description: Consulta el detalle de una asignatura específica por grado.
 *     tags: [Academic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idAsignature
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la asignatura
 *       - in: path
 *         name: valueGrado
 *         required: true
 *         schema:
 *           type: string
 *         description: Valor del grado
 *         example: "11"
 *     responses:
 *       200:
 *         description: Asignatura encontrada
 *       404:
 *         description: Asignatura no encontrada
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/academic/questions/{idquestion}/{idProgram}:
 *   get:
 *     summary: Obtener pregunta por ID
 *     description: Consulta una pregunta específica por su identificador.
 *     tags: [Academic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idquestion
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la pregunta
 *       - in: path
 *         name: idProgram
 *         required: false
 *         schema:
 *           type: string
 *         description: ID del programa (opcional)
 *     responses:
 *       200:
 *         description: Pregunta encontrada
 *       404:
 *         description: Pregunta no encontrada
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/academic/questions-by-type/{idPrograma}/{type}/{value}:
 *   get:
 *     summary: Obtener preguntas por programa y tipo/área
 *     description: Trae preguntas filtradas por programa y valor de clasificación.
 *     tags: [Academic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idPrograma
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: Tipo de clasificación
 *       - in: path
 *         name: value
 *         required: true
 *         schema:
 *           type: string
 *         description: Valor del tipo
 *     responses:
 *       200:
 *         description: Preguntas encontradas
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/academic/preguntas-por-tipo/{idPrograma}/{type}/{value}:
 *   get:
 *     summary: Obtener preguntas por tipo (compatibilidad)
 *     description: Alias de /questions-by-type con respuesta directa en JSON.
 *     tags: [Academic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idPrograma
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: value
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Preguntas encontradas
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/academic/academic-level/{collectionName}/{id}/{score}:
 *   get:
 *     summary: Obtener nivel académico por puntaje
 *     description: Calcula o consulta el nivel académico según colección, ID y score.
 *     tags: [Academic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre de la colección
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del documento
 *       - in: path
 *         name: score
 *         required: true
 *         schema:
 *           type: number
 *         description: Puntaje del estudiante
 *         example: 350
 *     responses:
 *       200:
 *         description: Nivel académico calculado
 *       401:
 *         description: No autorizado
 */

export {};
