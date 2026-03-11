import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { SemiIrtScoringService } from '../../../../application/services/SemiIrtScoringService';
import { UnalScoringService } from '../../../../application/services/UnalScoringService';

function getDb(): mongoose.mongo.Db {
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB no conectado');
    return db;
}

export async function calcularBatchSaber11(req: Request, res: Response) {
    const { idInstituto, idSimulacro, estudiantes } = req.body;

    if (!idInstituto || !Array.isArray(estudiantes) || estudiantes.length === 0) {
        return res.status(400).json({
            ok: false,
            error: 'Se requieren: idInstituto, estudiantes[]'
        });
    }

    try {
        const service = new SemiIrtScoringService(getDb());
        const resultados = await service.calcularBatch(idInstituto, idSimulacro ?? null, estudiantes);
        return res.status(200).json({ ok: true, resultados });
    } catch (err: unknown) {
        const mensaje = err instanceof Error ? err.message : 'Error desconocido';
        return res.status(500).json({ ok: false, error: mensaje });
    }
}

export async function calcularBatchUnal(req: Request, res: Response) {
    const { idInstituto, idSimulacro, estudiantes } = req.body;

    if (!idInstituto || !Array.isArray(estudiantes) || estudiantes.length === 0) {
        return res.status(400).json({
            ok: false,
            error: 'Se requieren: idInstituto, estudiantes[]'
        });
    }

    try {
        const service = new UnalScoringService(getDb());
        const resultados = await service.calcularBatch(idInstituto, idSimulacro ?? null, estudiantes);
        return res.status(200).json({ ok: true, resultados });

    } catch (err: unknown) {
        const mensaje = err instanceof Error ? err.message : 'Error desconocido';
        return res.status(500).json({ ok: false, error: mensaje });
    }
}

export async function recalibrarScoring(_req: Request, res: Response) {
    try {
        const actualizados = await recalibrarContadores(getDb());
        return res.status(200).json({ ok: true, contadoresActualizados: actualizados });
    } catch (err: unknown) {
        const mensaje = err instanceof Error ? err.message : 'Error desconocido';
        return res.status(500).json({ ok: false, error: mensaje });
    }
}

async function recalibrarContadores(db: mongoose.mongo.Db): Promise<number> {
    const resultados = await db
        .collection('resultados_preguntas')
        .aggregate([
            { $match: { idPregunta: { $exists: true, $nin: [null, ''] } } },
            {
                $group: {
                    _id: '$idPregunta',
                    trueCount: { $sum: { $cond: [{ $eq: ['$respuesta', true] }, 1, 0] } },
                    falseCount: { $sum: { $cond: [{ $eq: ['$respuesta', false] }, 1, 0] } },
                    total: { $sum: 1 },
                }
            }
        ])
        .toArray();

    if (resultados.length === 0) return 0;

    const bulkOps = resultados.map(r => {
        const difficulty = parseFloat((r.trueCount / r.total).toFixed(4));
        return {
            updateOne: {
                filter: { _id: r._id },
                update: {
                    $set: {
                        trueCount: r.trueCount,
                        falseCount: r.falseCount,
                        total_answers: r.total,
                        difficulty,
                        weight: parseFloat((1 - difficulty).toFixed(4)),
                        is_calibrated: r.total >= 5,
                        last_updated: new Date(),
                    }
                },
                upsert: true,
            }
        };
    });

    await db.collection('contadores_preguntas').bulkWrite(bulkOps, { ordered: false });
    return bulkOps.length;
}
