import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run(): Promise<void> {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error('MONGO_URI no definido');

    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db!;

    console.log('Recalculando contadores desde resultados_preguntas...');

    // 1. Agrupar respuestas reales por pregunta
    const pipeline = [
        {
            $match: {
                idPregunta: { $exists: true, $nin: [null, ""] }
            }
        },
        {
            $group: {
                _id: "$idPregunta",
                trueCount: { $sum: { $cond: [{ $eq: ["$respuesta", true] }, 1, 0] } },
                falseCount: { $sum: { $cond: [{ $eq: ["$respuesta", false] }, 1, 0] } },
                total: { $sum: 1 }
            }
        }
    ];

    const resultados = await db.collection('resultados_preguntas')
        .aggregate(pipeline).toArray();

    console.log(`Preguntas con respuestas reales: ${resultados.length}`);

    // 2. Actualizar contadores_preguntas con datos reales
    const bulkOps = resultados.map(r => {
        const difficulty = Number((r.trueCount / r.total).toFixed(4));
        const weight = Number((1 - difficulty).toFixed(4));

        return {
            updateOne: {
                filter: { _id: new mongoose.Types.ObjectId(r._id) },
                update: {
                    $set: {
                        trueCount: r.trueCount,
                        falseCount: r.falseCount,
                        total_answers: r.total,
                        difficulty,
                        weight,
                        is_calibrated: r.total >= 5,
                        last_updated: new Date()
                    }
                },
                upsert: true
            }
        };
    });

    if (bulkOps.length > 0) {
        await db.collection('contadores_preguntas').bulkWrite(bulkOps, { ordered: false });
    }

    // 3. Reporte final
    const calibradas = await db.collection('contadores_preguntas')
        .countDocuments({ is_calibrated: true });
    const noCalibradas = await db.collection('contadores_preguntas')
        .countDocuments({ is_calibrated: false });

    console.log(`✅ Contadores actualizados: ${bulkOps.length}`);
    console.log(`✅ Calibradas (>=5):  ${calibradas}`);
    console.log(`⏳ Pendientes (<5):   ${noCalibradas}`);

    await mongoose.disconnect();
}

run().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});