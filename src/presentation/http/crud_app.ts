import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import createDynamicModel from '../../infrastructure/database/dynamicModel';
import { removeLastS } from '../../shared/utils/utils';
import DatabaseConnection from '../../infrastructure/database/connection';

DatabaseConnection.getInstance()
const router = Router();

router.get('/preguntas-por-tipo/:idPrograma/:type/:value', async (req: Request, res: Response) => {
  const { idPrograma, type, value } = req.params;
  const GradosModel = createDynamicModel('Grados', {});
  const DetailsPreguntas = createDynamicModel('detail_preguntas', {});
  try {
    const document: any = await GradosModel.findById(idPrograma);
    if (!document) {
      return res.status(404).send();
    }
    let preguntas: any = [];
    for (const i of document.childrents) {
      // const data=await DetailsPreguntas.findById(i.id);
      const data = await DetailsPreguntas.find({
        [removeLastS(type)]: value,
        id: i.id
      },
        { "pregunta": 1, "cod": 1, "id": 1 } // Selección de camp
      )
      preguntas = data
    }
    res.status(200).send(preguntas);
  } catch (error) {
    res.status(500).send(error);
  }
})

router.get('/preguntas/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const DetailsPreguntas = createDynamicModel('detail_preguntas', {});
  const documentos: any = await DetailsPreguntas.findById(id);
  if (!documentos) {
    return res.status(404).send();
  }
  const pregunta = await getData("Preguntas", documentos.pregunta);
  const respuestas = await Promise.all(documentos.respuestas.map(async (r: any) => await getData("Respuestas", r)));
  res.status(200).send(
    {
      pregunta,
      respuestas,
    }
  );
})

router.get('/generate-simulacro/:id/:type', async (req: Request, res: Response) => {
  const { id, type } = req.params;
  const GradosModel = createDynamicModel('Grados', {});
  const DetailsPreguntas = createDynamicModel('detail_preguntas', {});

  try {
    const document: any = await GradosModel.findById(id);
    if (!document) {
      return res.status(404).send();
    }

    const data: any[] = document.config_simulacro[type];
    const preguntas = await Promise.all(data.map(async (i) => {
      const documentos = await DetailsPreguntas.find({
        [removeLastS(type)]: i.nombre,
      })
      // .limit(20);

      const docsConvers = await Promise.all(documentos.map(async (doc: any) => {
        const pregunta = await getData("Preguntas", doc.pregunta);
        const respuestas = await Promise.all(doc.respuestas.map(async (r: any) => await getData("Respuestas", r)));

        return {
          ...doc.toObject(),
          pregunta,
          respuestas,
        };
      }));

      return {
        name: i.nombre,
        session_1: i.preguntas.session_1,
        session_2: i.preguntas.session_2,
        preguntas: docsConvers
      };
    }));

    res.status(200).send(preguntas);
  } catch (error) {
    res.status(500).send(error);
  }
})

router.get('/detail_preguntas', async (req: Request, res: Response) => {
  const DynamicModel = createDynamicModel('detail_preguntas', {});
  const GradosModel = createDynamicModel('Grados', {});
  const AreasModel = createDynamicModel('Area', {});
  try {
    const documents = await DynamicModel.find();
    if (!documents || documents.length === 0) {
      return res.status(404).send({ message: 'No documents found' });
    }

    const result = await buildResult(documents, GradosModel, AreasModel);
    res.status(200).send(documents);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/clone-database', async (req: Request, res: Response) => {
  try {
    const sourceUri = 'mongodb://arkdevuser:q1CRB%2A8%252%3Fqk@54.164.38.115:27017/arkdevmongo';
    const targetUri = 'mongodb://localhost:27017/arkappformarte_clone_5';
    const sourceDbName = 'arkdevmongo';
    const targetDbName = 'arkappformarte_clone_5';

    await cloneDatabase(sourceUri, targetUri, sourceDbName, targetDbName);
    res.status(200).send({ message: `Database ${sourceDbName} cloned to ${targetDbName}` });
  } catch (error) {
    res.status(500).send({ error: 'Failed to clone the database', details: error });
  }
});


// Funciones auxiliares
const buildResult = async (documents: any[], GradosModel: mongoose.Model<any>, AreasModel: mongoose.Model<any>) => {
  const result: any = {};
  for (const document of documents) {
    const { grado, area, competencia, componente, asignatura, cod, tipo_platform } = document.toObject();

    // if (tipo_platform == "Examen") {

    if (grado == "Preuniversitario Unal") {
      /* matemáticas, ciencias naturales, ciencias sociales, análisis textual y análisis de imagen */

      if (area.trim().includes('Imagen')) 

      if (area.trim() == 'Matemáticas' || area.trim() == 'Ciencias Sociales' || area.trim() == 'Ciencias Naturales' || area.trim() == 'Análisis Textual' || area.trim() == 'Análisis de la Imagen') {

        if (!result[grado]) {
          result[grado] = {
            areas: [],
            competencias: [],
            componentes: [],
            asignaturas: [],
            childrents: []
          };
        }

        if (area !== 'N/A' && !result[grado].areas.find((a: any) => a.nombre === area)) {
          result[grado].areas.push({
            nombre: area,
            sessions: {
              session_1: 0,
              session_2: 0
            }
          });

          const are: any = await AreasModel.findOne({ value: area })
          if (!validateIdUnique(result[grado].childrents, are.id)) {
            result[grado].childrents.push(are.id);
          }
        }

        if (asignatura !== 'N/A' && !result[grado].asignaturas.find((c: any) => c.nombre === asignatura)) {
          result[grado].asignaturas.push({
            nombre: asignatura,
            sessions: {
              session_1: 0,
              session_2: 0
            }
          });

        }
        if (competencia !== 'N/A' && !result[grado].competencias.find((c: any) => c.nombre === competencia)) {
          result[grado].competencias.push({
            nombre: competencia,
            sessions: {
              session_1: 0,
              session_2: 0
            }
          });
        }

        if (componente !== 'N/A' && !result[grado].componentes.find((c: any) => c.nombre === componente)) {
          result[grado].componentes.push({
            nombre: componente,
            sessions: {
              session_1: 0,
              session_2: 0
            }
          });
        }
      }

    }
  }
  // Buscar los grados en la base de datos
  const docGrados: any[] = await GradosModel.find();

  for (const element of docGrados) {
    const grado = element.value;

    if (result[grado]) {
      if (!element.config_simulacro || !element.childrents) {

        const childrents = result[grado].childrents;

        const configFinal = {
          areas: result[grado].areas,
          competencias: result[grado].competencias,
          componentes: result[grado].componentes,
          asignaturas: result[grado].asignaturas,

        }
        // Si config_simulacro no existe, se crea
        const updatedDocument = await GradosModel.findByIdAndUpdate(element._id, {
          config_simulacro: configFinal,
          childrents: childrents
        }, { new: true, runValidators: true });
      } else {
        // Si config_simulacro ya existe, verificar y agregar nuevos elementos
        const existingConfig = element.config_simulacro;
        // Función para agregar nuevos elementos si no existen
        const mergeConfigs = (existingConfig: any, newConfig: any) => {
          const addIfNotExists = (existingArray: any[], newArray: any[]) => {
            newArray.forEach(newItem => {
              if (!existingArray.some(existingItem => existingItem.nombre === newItem.nombre)) {
                existingArray.push(newItem);
              }
            });
          };
          addIfNotExists(existingConfig.areas, newConfig.areas);
          addIfNotExists(existingConfig.competencias, newConfig.competencias);
          addIfNotExists(existingConfig.componentes, newConfig.componentes);
        };
        const childrents = result[grado].childrents;

        const configFinal = {
          areas: result[grado].areas,
          competencias: result[grado].competencias,
          componentes: result[grado].componentes,
          asignaturas: result[grado].asignaturas,

        }
        mergeConfigs(existingConfig, result[grado]);
        await GradosModel.findByIdAndUpdate(element._id, {
          config_simulacro: configFinal,
          childrents: childrents
        }, { new: true, runValidators: true });

      }
    }
  }
  return result;
};

const validateIdUnique = (ids: string[], id: string): boolean => {

  let exist: boolean = false;
  for (const i of ids) {
    if (i == id) {
      exist = true;
    }
  }
  return exist;
}

async function getData(collection: string, id: string) {
  const DynamicModel = createDynamicModel(collection, {});
  try {
    const document = await DynamicModel.findById(id);
    return document;
  } catch (error) {

    return undefined;
  }
}

async function cloneDatabase(sourceUri: string, targetUri: string, sourceDbName: string, targetDbName: string): Promise<void> {
  const sourceClient = new mongoose.Mongoose();
  const targetClient = new mongoose.Mongoose();

  try {
    // Conexión a la base de datos de origen
    await sourceClient.connect(sourceUri);
    const sourceDb: any = sourceClient.connection.db;

    // Conexión a la base de datos de destino
    await targetClient.connect(targetUri);
    const targetDb: any = targetClient.connection.db;

    // Drop target database if it exists
    try {
      await targetDb.dropDatabase();
    } catch (error) {
    }

    // Listar todas las colecciones de la base de datos origen
    const collections = await sourceDb.listCollections().toArray();

    // Iterar sobre cada colección y clonarla
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;

      const sourceCollection = sourceDb.collection(collectionName);
      const targetCollection = targetDb.collection(collectionName);

      // Obtener todos los documentos de la colección origen
      const documents = await sourceCollection.find().toArray();

      // Insertar los documentos en la colección destino
      if (documents.length > 0) {
        await targetCollection.insertMany(documents);
      } else {
      }
    }

  } catch (error) {
    console.error('Error during database cloning:', error);
    throw error;
  } finally {
    // Cerrar las conexiones a las bases de datos
    await sourceClient.disconnect();
    await targetClient.disconnect();
  }
}

export default router;