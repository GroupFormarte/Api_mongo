import mongoose from 'mongoose';
import { env } from '../../shared/config/env';

type CounterDoc = {
  _id: mongoose.Types.ObjectId;
  trueCount?: number;
  falseCount?: number;
};

type SimulacrumDoc = {
  _id: mongoose.Types.ObjectId;
  tipo_examen?: string;
  base_calificacion?: string;
};

const VALID_EXAM_TYPES = new Set(['saber11', 'unal', 'udea']);

function normalizeExamType(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return VALID_EXAM_TYPES.has(normalized) ? normalized : null;
}

async function run(): Promise<void> {
  const mongoUri = env.mongoUri;

  if (!mongoUri) {
    throw new Error('MONGO_URI environment variable is not defined');
  }

  await mongoose.connect(mongoUri);

  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('MongoDB database connection is not available');
    }

    const collection = db.collection('contadores_preguntas');

    const docs = collection.find({}) as unknown as AsyncIterable<CounterDoc>;
    const bulkOps: Array<{ updateOne: { filter: { _id: mongoose.Types.ObjectId }; update: { $set: { difficulty: number; weight: number; is_calibrated: boolean; total_answers: number } } } }> = [];

    for await (const doc of docs) {
      const trueCount = Number(doc.trueCount ?? 0);
      const falseCount = Number(doc.falseCount ?? 0);
      const total = trueCount + falseCount;

      if (total === 0) {
        continue;
      }

      const difficulty = Number((trueCount / total).toFixed(4));
      const weight = Number((1 - difficulty).toFixed(4));
      const calibrated = total >= 30;

      bulkOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              difficulty,
              weight,
              is_calibrated: calibrated,
              total_answers: total
            }
          }
        }
      });
    }

    if (bulkOps.length > 0) {
      await collection.bulkWrite(bulkOps, { ordered: false });
    }

    const calibratedQuestions = await collection.countDocuments({ difficulty: { $exists: true } });
    const calibratedAtLeast30 = await collection.countDocuments({ is_calibrated: true });

    console.log(`Migracion completa: ${calibratedQuestions} preguntas calibradas`);
    console.log(`Calibradas (>=30): ${calibratedAtLeast30}`);

    const simulacrumsCollection = db.collection('simulacrums');
    const simulacrums = simulacrumsCollection.find({}) as unknown as AsyncIterable<SimulacrumDoc>;
    const simulacrumOps: Array<{
      updateOne: {
        filter: { _id: mongoose.Types.ObjectId };
        update: { $set: { tipo_examen: string } };
      };
    }> = [];

    for await (const doc of simulacrums) {
      const currentType = normalizeExamType(doc.tipo_examen);
      if (currentType) {
        if (doc.tipo_examen !== currentType) {
          simulacrumOps.push({
            updateOne: {
              filter: { _id: doc._id },
              update: { $set: { tipo_examen: currentType } }
            }
          });
        }
        continue;
      }

      const basedOnCalificacion = normalizeExamType(doc.base_calificacion);
      const resolvedType = basedOnCalificacion ?? 'saber11';

      simulacrumOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { tipo_examen: resolvedType } }
        }
      });
    }

    if (simulacrumOps.length > 0) {
      await simulacrumsCollection.bulkWrite(simulacrumOps, { ordered: false });
    }

    const simulacrumsWithType = await simulacrumsCollection.countDocuments({ tipo_examen: { $exists: true } });
    const saber11Count = await simulacrumsCollection.countDocuments({ tipo_examen: 'saber11' });
    const unalCount = await simulacrumsCollection.countDocuments({ tipo_examen: 'unal' });
    const udeaCount = await simulacrumsCollection.countDocuments({ tipo_examen: 'udea' });

    console.log(`Simulacrums con tipo_examen: ${simulacrumsWithType}`);
    console.log(`Distribucion tipo_examen -> saber11: ${saber11Count}, unal: ${unalCount}, udea: ${udeaCount}`);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
