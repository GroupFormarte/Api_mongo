import createDynamicModel from '../../infrastructure/database/dynamicModel';

const INTERVALO = 5 * 60 * 1000; // cada 5 minutos
const Estudiantes: any = createDynamicModel('Estudiantes', {});

export async function startTrackingPositions(): Promise<void> {
    setInterval(async () => {
        try {
            const estudiantes = await Estudiantes.find().lean();
            const gradosMap = new Map<string, any[]>();
            for (const estudiante of estudiantes) {
                for (const gradoData of estudiante.grados) {
                    if (gradoData.scoreSimulacro && gradoData.scoreSimulacro > 0) {
                        if (!gradosMap.has(gradoData.grado)) {
                            gradosMap.set(gradoData.grado, []);
                        }
                        gradosMap.get(gradoData.grado)!.push({
                            id_student: estudiante.id_student,
                            score: gradoData.scoreSimulacro,
                            historyPosition: gradoData.historyPosition || [],
                        });
                    }
                }
            }
            // Recalcular posiciones por grado
            for (const [grado, estudiantesPorGrado] of gradosMap.entries()) {
                estudiantesPorGrado.sort((a, b) => b.score - a.score);
                for (let i = 0; i < estudiantesPorGrado.length; i++) {
                    const estudiante = estudiantesPorGrado[i];
                    const posicionActual = i + 1;
                    const fecha = new Date().toISOString();
                    const historial = estudiante.historyPosition || [];
                    const ultima = historial[historial.length - 1];
                    // Solo actualiza si hay cambio de posición
                    if (!ultima || ultima.position !== posicionActual) {
                        await Estudiantes.updateOne(
                            { id_student: estudiante.id_student, 'grados.grado': grado },
                            {
                                $push: {
                                    'grados.$.historyPosition': {
                                        $each: [{ date: fecha, position: posicionActual }],
                                        $slice: -3 // ← solo mantener los últimos 3
                                    },
                                },
                            }
                        );
                        console.log(`Actualizada posición de ${estudiante.id_student} en grado ${grado} a ${posicionActual}`);
                    }
                }
            }
        } catch (error) {
            console.error('Error actualizando posiciones:', error);
        }
    }, INTERVALO);
}