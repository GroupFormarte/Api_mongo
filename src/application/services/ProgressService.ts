import createDynamicModel from '../../infrastructure/database/dynamicModel';
import { format } from 'date-fns';

export class ProgressService {
    private ResultadosModel: any;
    private DetallePreguntasModel: any;
    private EstudiantesModel: any;

    constructor() {
        this.ResultadosModel = createDynamicModel('resultados_preguntas', {});
        this.DetallePreguntasModel = createDynamicModel('question_details', {});
        this.EstudiantesModel = createDynamicModel('Estudiantes', {});
    }

    private filterByDate(resultados: any[], fechaInicio?: string, fechaFin?: string): any[] {
        if (!fechaInicio || !fechaFin) {
            const currentYear = new Date().getFullYear();
            return resultados.filter((r: any) => {
                const date = new Date(r.dateCreated);
                return date.getFullYear() === currentYear;
            });
        }

        const start = new Date(fechaInicio);
        const end = new Date(fechaFin);

        return resultados.filter((r: any) => {
            const date = new Date(r.dateCreated);
            return date >= start && date <= end;
        });
    }

    async getGlobalAnalysis(params: {
        idGrado: string;
        idInstituto: string;
        fechaInicio?: string;
        fechaFin?: string;
    }) {
        const { idGrado, idInstituto, fechaInicio, fechaFin } = params;

        const filtroFecha: any = { idGrado, idInstituto };
        let resultados: any[] = await this.ResultadosModel.find(filtroFecha);
        resultados = this.filterByDate(resultados, fechaInicio, fechaFin);

        const resumen: Record<string, {
            progressAsignature: Record<string, {
                nombre: string;
                id: string;
                errores: number;
                aciertos: number;
            }>;
        }> = {};

        const resumenGlobal: Record<string, {
            nombre: string;
            id: string;
            aciertos: number;
            errores: number;
            estudiantes: Set<string>;
        }> = {};

        const balanceMensual: Record<string, {
            totalPreguntas: number;
            aciertos: number;
            errores: number;
            porcentajeAcierto: number;
        }> = {};

        for (const r of resultados) {
            const pregunta = await this.DetallePreguntasModel.findById(r.idPregunta);
            if (!pregunta) {
                continue;
            }

            const area = pregunta.area || 'Sin área';
            const nombreAsignatura = pregunta.asignatura || 'Sin asignatura';
            const mes = format(new Date(r.dateCreated), 'yyyy-MM');

            if (!resumen[area]) {
                resumen[area] = { progressAsignature: {} };
            }

            const entry = resumen[area];
            const asignaturaProgress = entry.progressAsignature[nombreAsignatura] || {
                nombre: nombreAsignatura,
                id: r.idAsignatura,
                errores: 0,
                aciertos: 0
            };

            if (!balanceMensual[mes]) {
                balanceMensual[mes] = {
                    totalPreguntas: 0,
                    aciertos: 0,
                    errores: 0,
                    porcentajeAcierto: 0
                };
            }

            if (r.respuesta === true) {
                asignaturaProgress.aciertos++;
                balanceMensual[mes].aciertos++;
            } else {
                asignaturaProgress.errores++;
                balanceMensual[mes].errores++;
            }

            balanceMensual[mes].totalPreguntas++;
            balanceMensual[mes].porcentajeAcierto = Math.round(
                (balanceMensual[mes].aciertos / balanceMensual[mes].totalPreguntas) * 100
            );

            entry.progressAsignature[nombreAsignatura] = asignaturaProgress;
        }

        for (const r of resultados) {
            const pregunta = await this.DetallePreguntasModel.findById(r.idPregunta);
            if (!pregunta) {
                continue;
            }

            const nombreAsignatura = r.asignatura || 'Sin asignatura';
            if (!resumenGlobal[nombreAsignatura]) {
                resumenGlobal[nombreAsignatura] = {
                    nombre: nombreAsignatura,
                    id: r.idAsignatura,
                    aciertos: 0,
                    errores: 0,
                    estudiantes: new Set()
                };
            }

            if (r.respuesta === true) {
                resumenGlobal[nombreAsignatura].aciertos++;
            } else {
                resumenGlobal[nombreAsignatura].errores++;
            }

            resumenGlobal[nombreAsignatura].estudiantes.add(r.idEstudiante);
        }

        const analisisPorArea = Object.entries(resumen)
            .map(([area, data]) => ({
                area,
                asignaturas: Object.values(data.progressAsignature).map((a) => ({
                    asignatura: a.nombre,
                    idAsignatura: a.id,
                    aciertos: a.aciertos,
                    errores: a.errores
                }))
            }))
            .filter((area) => area.asignaturas.length > 0);

        const resumenGlobalArray = Object.values(resumenGlobal).map((asig) => {
            const total = asig.aciertos + asig.errores;
            return {
                asignatura: asig.nombre,
                idAsignatura: asig.id,
                totalPreguntas: total,
                aciertos: asig.aciertos,
                errores: asig.errores,
                porcentajeAcierto: total > 0 ? Math.round((asig.aciertos / total) * 100) : 0,
                estudiantes: asig.estudiantes.size
            };
        });

        return {
            analisisPorArea,
            resumenGlobal: resumenGlobalArray,
            balanceGeneral: balanceMensual
        };
    }

    async getStudentSubjectAnalysis(params: {
        idEstudiante: string;
        idGrado: string;
        idInstituto: string;
        fechaInicio?: string;
        fechaFin?: string;
    }) {
        const { idEstudiante, idGrado, idInstituto, fechaInicio, fechaFin } = params;

        const filtroFecha: any = { idEstudiante, idGrado, idInstituto };
        let resultados: any[] = await this.ResultadosModel.find(filtroFecha);
        resultados = this.filterByDate(resultados, fechaInicio, fechaFin);

        const resumen: Record<string, {
            progressAsignature: Record<string, {
                nombre: string;
                id: string;
                errores: number;
                aciertos: number;
            }>;
        }> = {};

        const resumenGlobal: Record<string, {
            nombre: string;
            id: string;
            aciertos: number;
            errores: number;
        }> = {};

        const balanceMensual: Record<string, {
            totalPreguntas: number;
            aciertos: number;
            errores: number;
            porcentajeAcierto: number;
        }> = {};

        for (const r of resultados) {
            const pregunta = await this.DetallePreguntasModel.findById(r.idPregunta);
            if (!pregunta) {
                continue;
            }

            const area = pregunta.area || 'Sin área';
            const nombreAsignatura = pregunta.asignatura || 'Sin asignatura';
            const mes = format(new Date(r.dateCreated), 'yyyy-MM');

            if (!resumen[area]) {
                resumen[area] = { progressAsignature: {} };
            }

            const entry = resumen[area];
            const asignaturaProgress = entry.progressAsignature[nombreAsignatura] || {
                nombre: nombreAsignatura,
                id: r.idAsignatura,
                errores: 0,
                aciertos: 0
            };

            if (!resumenGlobal[nombreAsignatura]) {
                resumenGlobal[nombreAsignatura] = {
                    nombre: nombreAsignatura,
                    id: r.idAsignatura,
                    aciertos: 0,
                    errores: 0
                };
            }

            if (!balanceMensual[mes]) {
                balanceMensual[mes] = {
                    totalPreguntas: 0,
                    aciertos: 0,
                    errores: 0,
                    porcentajeAcierto: 0
                };
            }

            if (r.respuesta === true) {
                asignaturaProgress.aciertos++;
                resumenGlobal[nombreAsignatura].aciertos++;
                balanceMensual[mes].aciertos++;
            } else {
                asignaturaProgress.errores++;
                resumenGlobal[nombreAsignatura].errores++;
                balanceMensual[mes].errores++;
            }

            balanceMensual[mes].totalPreguntas++;
            balanceMensual[mes].porcentajeAcierto = Math.round(
                (balanceMensual[mes].aciertos / balanceMensual[mes].totalPreguntas) * 100
            );

            entry.progressAsignature[nombreAsignatura] = asignaturaProgress;
        }

        const analisisPorArea = Object.entries(resumen)
            .map(([area, data]) => ({
                area,
                asignaturas: Object.values(data.progressAsignature).map((a) => ({
                    asignatura: a.nombre,
                    idAsignatura: a.id,
                    aciertos: a.aciertos,
                    errores: a.errores
                }))
            }))
            .filter((area) => area.asignaturas.length > 0);

        const resumenGlobalArray = Object.values(resumenGlobal).map((asig) => {
            const total = asig.aciertos + asig.errores;
            return {
                asignatura: asig.nombre,
                idAsignatura: asig.id,
                totalPreguntas: total,
                aciertos: asig.aciertos,
                errores: asig.errores,
                porcentajeAcierto: total > 0 ? Math.round((asig.aciertos / total) * 100) : 0
            };
        });

        return {
            analisisPorArea,
            resumenGlobal: resumenGlobalArray,
            balanceGeneral: balanceMensual
        };
    }

    async getPositionsAnalysis(params: {
        idGrado: string;
        idInstituto: string;
        fechaInicio?: string;
        fechaFin?: string;
    }) {
        const { idGrado, idInstituto, fechaInicio, fechaFin } = params;

        // ── 1. Filtro de fechas──────────────
        const matchFecha: Record<string, unknown> = { idGrado, idInstituto };

        if (fechaInicio || fechaFin) {
            const inicio = fechaInicio ?? `${new Date().getFullYear()}-01-01`;
            const fin = fechaFin ?? `${new Date().getFullYear()}-12-31`;
            matchFecha['dateCreated'] = { $gte: inicio, $lte: fin + ' 23:59:59' };
        }

        // ── 2. Aggregate: aciertos/errores por estudiante + asignatura ───────────
        const pipeline = [
            { $match: matchFecha },
            {
                $group: {
                    _id: {
                        idEstudiante: '$idEstudiante',
                        asignatura: '$asignatura',
                    },
                    aciertos: { $sum: { $cond: ['$respuesta', 1, 0] } },
                    errores: { $sum: { $cond: ['$respuesta', 0, 1] } },
                }
            }
        ];

        const resultados = await this.ResultadosModel.aggregate(pipeline);

        if (resultados.length === 0) {
            return { asignaturas: [], areas: [], mejoresPorAsignatura: [], mejoresPorArea: [] };
        }

        // ── 3. Cargar datos de estudiantes en una sola query ─────────────────────
        const idsEstudiantes = [...new Set(resultados.map((r: any) => r._id.idEstudiante))];

        const estudiantesRaw = await this.EstudiantesModel.find({
            id_student: { $in: idsEstudiantes }
        }).select('id_student name second_name last_name second_last_name identification_number');

        const estudianteMap = new Map<string, { nombre: string; numberId: string }>();
        for (const e of estudiantesRaw) {
            const nombre = `${e.name ?? ''} ${e.second_name ?? ''} ${e.last_name ?? ''} ${e.second_last_name ?? ''}`.replace(/\s+/g, ' ').trim();
            estudianteMap.set(e.id_student, {
                nombre,
                numberId: e.identification_number ?? '',
            });
        }

        // ── 4. Mapeo asignatura ─
        function mapAsignaturaToArea(asignatura: string): string {
            return asignatura; // cada prueba maneja sus propias áreas
        }

        // ── 5. Acumular por asignatura y área
        type EntradaRanking = {
            idEstudiante: string;
            nombreEstudiante: string;
            numberId: string;
            aciertos: number;
            errores: number;
        };

        const porAsignatura = new Map<string, Map<string, EntradaRanking>>();
        const porArea = new Map<string, Map<string, EntradaRanking>>();

        for (const r of resultados) {
            const idEstudiante = r._id.idEstudiante;
            const asignatura = r._id.asignatura ?? 'Sin asignatura';
            const area = mapAsignaturaToArea(asignatura);
            const estudiante = estudianteMap.get(idEstudiante);

            const entrada: EntradaRanking = {
                idEstudiante,
                nombreEstudiante: estudiante?.nombre ?? idEstudiante,
                numberId: estudiante?.numberId ?? '',
                aciertos: r.aciertos,
                errores: r.errores,
            };

            // Por asignatura
            if (!porAsignatura.has(asignatura)) porAsignatura.set(asignatura, new Map());
            const mapaAsig = porAsignatura.get(asignatura)!;
            if (mapaAsig.has(idEstudiante)) {
                // acumular si el estudiante aparece en varias sesiones
                const prev = mapaAsig.get(idEstudiante)!;
                prev.aciertos += r.aciertos;
                prev.errores += r.errores;
            } else {
                mapaAsig.set(idEstudiante, { ...entrada });
            }

            // Por área
            if (!porArea.has(area)) porArea.set(area, new Map());
            const mapaArea = porArea.get(area)!;
            if (mapaArea.has(idEstudiante)) {
                const prev = mapaArea.get(idEstudiante)!;
                prev.aciertos += r.aciertos;
                prev.errores += r.errores;
            } else {
                mapaArea.set(idEstudiante, { ...entrada });
            }
        }

        // ── 6. Construir ranking ordenado─────
        function buildRanking(mapa: Map<string, EntradaRanking>) {
            return Array.from(mapa.values())
                .map(e => ({
                    ...e,
                    total: e.aciertos + e.errores,
                    porcentajeAcierto: e.aciertos + e.errores > 0
                        ? Math.round((e.aciertos / (e.aciertos + e.errores)) * 100)
                        : 0,
                }))
                .sort((a, b) => b.porcentajeAcierto - a.porcentajeAcierto);
        }

        const asignaturas = Array.from(porAsignatura.entries()).map(([nombre, mapa]) => ({
            asignatura: nombre,
            estudiantes_por_posicion: buildRanking(mapa),
        }));

        const areas = Array.from(porArea.entries()).map(([nombre, mapa]) => ({
            area: nombre,
            estudiantes_por_posicion: buildRanking(mapa),
        }));

        const mejoresPorAsignatura = asignaturas.map(a => ({
            asignatura: a.asignatura,
            estudiantes_por_posicion: a.estudiantes_por_posicion.slice(0, 1),
        }));

        const mejoresPorArea = areas.map(a => ({
            area: a.area,
            estudiantes_por_posicion: a.estudiantes_por_posicion.slice(0, 1),
        }));

        return { asignaturas, areas, mejoresPorAsignatura, mejoresPorArea };
    }
}
