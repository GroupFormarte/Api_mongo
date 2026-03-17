/**
 * @swagger
 * tags:
 *   name: Progress
 *   description: Analítica de rendimiento y rankings de estudiantes (requiere autenticación)
 */

/**
 * @swagger
 * /progress-app/analisis/global/{idGrado}/{idInstituto}:
 *   get:
 *     summary: Obtener análisis global por grado e instituto
 *     description: Devuelve el rendimiento general por área y asignatura en el periodo consultado.
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idGrado
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del grado
 *       - in: path
 *         name: idInstituto
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del instituto
 *       - in: query
 *         name: fechaInicio
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (YYYY-MM-DD). Si no se envía, se usa el año actual.
 *       - in: query
 *         name: fechaFin
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD). Si no se envía, se usa el año actual.
 *     responses:
 *       200:
 *         description: Análisis global obtenido correctamente
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /progress-app/analisis/asignaturas/{idEstudiante}/{idGrado}/{idInstituto}:
 *   get:
 *     summary: Obtener análisis por asignaturas de un estudiante
 *     description: Retorna desempeño del estudiante por asignatura y área, con balance mensual del periodo.
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idEstudiante
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del estudiante
 *       - in: path
 *         name: idGrado
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del grado
 *       - in: path
 *         name: idInstituto
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del instituto
 *       - in: query
 *         name: fechaInicio
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (YYYY-MM-DD). Si no se envía, se usa el año actual.
 *       - in: query
 *         name: fechaFin
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD). Si no se envía, se usa el año actual.
 *     responses:
 *       200:
 *         description: Análisis por asignaturas obtenido correctamente
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /progress-app/analisis/posiciones/{idGrado}/{idInstituto}:
 *   get:
 *     summary: Obtener análisis de posiciones (ranking)
 *     description: Genera ranking por asignatura y por área para el grado e instituto especificados.
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idGrado
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del grado
 *       - in: path
 *         name: idInstituto
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del instituto
 *       - in: query
 *         name: fechaInicio
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (YYYY-MM-DD). Si no se envía, se usa el año actual.
 *       - in: query
 *         name: fechaFin
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD). Si no se envía, se usa el año actual.
 *     responses:
 *       200:
 *         description: Ranking obtenido correctamente
 *       401:
 *         description: No autorizado
 */

export {};
