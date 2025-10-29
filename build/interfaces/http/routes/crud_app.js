"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const dynamicModel_1 = __importDefault(require("../../../infrastructure/database/dynamicModel"));
const dotenv_1 = __importDefault(require("dotenv"));
const utils_1 = require("../../../shared/utils/utils");
// Cargar las variables de entorno
dotenv_1.default.config();
const mongoDB = process.env.MONGO_URI || '';
/*
detaail evaluacion
{
  "cod":"",
  "categoria":"",
  "sessions":1,
  "base_calificacion":"",
  "esquema_cal":"",
  "nameUser":""
  "contenido":[

  ""
  ]
}
*/
// Conexión a MongoDB
mongoose_1.default.connect(mongoDB)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));
const router = (0, express_1.Router)();
const validateIdUnique = (ids, id) => {
    let exist = false;
    for (const i of ids) {
        if (i == id) {
            exist = true;
        }
    }
    return exist;
};
// Función para construir el resultado
const buildResult = (documents, GradosModel, AreasModel) => __awaiter(void 0, void 0, void 0, function* () {
    const result = {};
    for (const document of documents) {
        const { grado, area, competencia, componente, asignatura, cod, tipo_platform } = document.toObject();
        // if (tipo_platform == "Examen") {
        if (grado == "Preuniversitario Unal") {
            /* matemáticas, ciencias naturales, ciencias sociales, análisis textual y análisis de imagen */
            if (area.trim().includes('Imagen')) {
                console.log({ grado, area });
            }
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
                if (area !== 'N/A' && !result[grado].areas.find((a) => a.nombre === area)) {
                    result[grado].areas.push({
                        nombre: area,
                        sessions: {
                            session_1: 0,
                            session_2: 0
                        }
                    });
                    const are = yield AreasModel.findOne({
                        value: area
                    });
                    if (!validateIdUnique(result[grado].childrents, are.id)) {
                        result[grado].childrents.push(are.id);
                    }
                }
                if (asignatura !== 'N/A' && !result[grado].asignaturas.find((c) => c.nombre === asignatura)) {
                    result[grado].asignaturas.push({
                        nombre: asignatura,
                        sessions: {
                            session_1: 0,
                            session_2: 0
                        }
                    });
                }
                if (competencia !== 'N/A' && !result[grado].competencias.find((c) => c.nombre === competencia)) {
                    result[grado].competencias.push({
                        nombre: competencia,
                        sessions: {
                            session_1: 0,
                            session_2: 0
                        }
                    });
                }
                if (componente !== 'N/A' && !result[grado].componentes.find((c) => c.nombre === componente)) {
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
    const docGrados = yield GradosModel.find();
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
                };
                // Si config_simulacro no existe, se crea
                const updatedDocument = yield GradosModel.findByIdAndUpdate(element._id, {
                    config_simulacro: configFinal,
                    childrents: childrents
                }, { new: true, runValidators: true });
            }
            else {
                // Si config_simulacro ya existe, verificar y agregar nuevos elementos
                const existingConfig = element.config_simulacro;
                // Función para agregar nuevos elementos si no existen
                const mergeConfigs = (existingConfig, newConfig) => {
                    const addIfNotExists = (existingArray, newArray) => {
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
                };
                // Agregar los elementos que faltan
                mergeConfigs(existingConfig, result[grado]);
                // Guardar la configuración actualizada
                // console.log({configFinal,
                // childrents});
                yield GradosModel.findByIdAndUpdate(element._id, {
                    config_simulacro: configFinal,
                    childrents: childrents
                }, { new: true, runValidators: true });
            }
        }
    }
    return result;
});
router.get('/preguntas-por-tipo/:idPrograma/:type/:value', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { idPrograma, type, value } = req.params;
    const GradosModel = (0, dynamicModel_1.default)('Grados', {});
    const DetailsPreguntas = (0, dynamicModel_1.default)('detail_preguntas', {});
    try {
        const document = yield GradosModel.findById(idPrograma);
        if (!document) {
            return res.status(404).send();
        }
        let preguntas = [];
        for (const i of document.childrents) {
            // const data=await DetailsPreguntas.findById(i.id);
            const data = yield DetailsPreguntas.find({
                [(0, utils_1.removeLastS)(type)]: value,
                id: i.id
            }, { "pregunta": 1, "cod": 1, "id": 1 } // Selección de camp
            );
            preguntas = data;
        }
        res.status(200).send(preguntas);
    }
    catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}));
router.get('/preguntas/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const DetailsPreguntas = (0, dynamicModel_1.default)('detail_preguntas', {});
    const documentos = yield DetailsPreguntas.findById(id);
    if (!documentos) {
        return res.status(404).send();
    }
    const pregunta = yield getData("Preguntas", documentos.pregunta);
    const respuestas = yield Promise.all(documentos.respuestas.map((r) => __awaiter(void 0, void 0, void 0, function* () { return yield getData("Respuestas", r); })));
    res.status(200).send({
        pregunta,
        respuestas,
    });
}));
router.get('/generate-simulacro/:id/:type', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, type } = req.params;
    const GradosModel = (0, dynamicModel_1.default)('Grados', {});
    const DetailsPreguntas = (0, dynamicModel_1.default)('detail_preguntas', {});
    try {
        const document = yield GradosModel.findById(id);
        if (!document) {
            return res.status(404).send();
        }
        const data = document.config_simulacro[type];
        const preguntas = yield Promise.all(data.map((i) => __awaiter(void 0, void 0, void 0, function* () {
            const documentos = yield DetailsPreguntas.find({
                [(0, utils_1.removeLastS)(type)]: i.nombre,
            });
            // .limit(20);
            const docsConvers = yield Promise.all(documentos.map((doc) => __awaiter(void 0, void 0, void 0, function* () {
                const pregunta = yield getData("Preguntas", doc.pregunta);
                const respuestas = yield Promise.all(doc.respuestas.map((r) => __awaiter(void 0, void 0, void 0, function* () { return yield getData("Respuestas", r); })));
                return Object.assign(Object.assign({}, doc.toObject()), { pregunta,
                    respuestas });
            })));
            return {
                name: i.nombre,
                session_1: i.preguntas.session_1,
                session_2: i.preguntas.session_2,
                preguntas: docsConvers
            };
        })));
        res.status(200).send(preguntas);
    }
    catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}));
router.get('/detail_preguntas', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const DynamicModel = (0, dynamicModel_1.default)('detail_preguntas', {});
    const GradosModel = (0, dynamicModel_1.default)('Grados', {});
    const AreasModel = (0, dynamicModel_1.default)('Area', {});
    try {
        const documents = yield DynamicModel.find();
        if (!documents || documents.length === 0) {
            return res.status(404).send({ message: 'No documents found' });
        }
        const result = yield buildResult(documents, GradosModel, AreasModel);
        res.status(200).send(documents);
    }
    catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}));
function getData(collection, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const DynamicModel = (0, dynamicModel_1.default)(collection, {});
        try {
            const document = yield DynamicModel.findById(id);
            return document;
        }
        catch (error) {
            console.log(error);
            return undefined;
        }
    });
}
//_____________
// Función para clonar una base de datos
function cloneDatabase(sourceUri, targetUri, sourceDbName, targetDbName) {
    return __awaiter(this, void 0, void 0, function* () {
        const sourceClient = new mongoose_1.default.Mongoose();
        const targetClient = new mongoose_1.default.Mongoose();
        try {
            // Conexión a la base de datos de origen
            yield sourceClient.connect(sourceUri);
            const sourceDb = sourceClient.connection.db;
            console.log(`Connected to source database: ${sourceDbName}`);
            // Conexión a la base de datos de destino
            yield targetClient.connect(targetUri);
            const targetDb = targetClient.connection.db;
            console.log(`Connected to target database: ${targetDbName}`);
            // Drop target database if it exists
            try {
                yield targetDb.dropDatabase();
                console.log(`Target database ${targetDbName} dropped`);
            }
            catch (error) {
                console.log(`Target database ${targetDbName} does not exist or could not be dropped`);
            }
            // Listar todas las colecciones de la base de datos origen
            const collections = yield sourceDb.listCollections().toArray();
            // Iterar sobre cada colección y clonarla
            for (const collectionInfo of collections) {
                const collectionName = collectionInfo.name;
                console.log(`Cloning collection: ${collectionName}`);
                const sourceCollection = sourceDb.collection(collectionName);
                const targetCollection = targetDb.collection(collectionName);
                // Obtener todos los documentos de la colección origen
                const documents = yield sourceCollection.find().toArray();
                // Insertar los documentos en la colección destino
                if (documents.length > 0) {
                    yield targetCollection.insertMany(documents);
                    console.log(`Cloned ${documents.length} documents into ${targetDbName}.${collectionName}`);
                }
                else {
                    console.log(`Collection ${collectionName} is empty, skipping...`);
                }
            }
            console.log(`Database ${sourceDbName} successfully cloned to ${targetDbName}`);
        }
        catch (error) {
            console.error('Error during database cloning:', error);
            throw error;
        }
        finally {
            // Cerrar las conexiones a las bases de datos
            yield sourceClient.disconnect();
            yield targetClient.disconnect();
        }
    });
}
// Ruta para clonar una base de datos
router.post('/clone-database', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sourceUri = 'mongodb://arkdevuser:q1CRB%2A8%252%3Fqk@54.164.38.115:27017/arkdevmongo';
        const targetUri = 'mongodb://localhost:27017/arkappformarte_clone_5';
        const sourceDbName = 'arkdevmongo';
        const targetDbName = 'arkappformarte_clone_5';
        yield cloneDatabase(sourceUri, targetUri, sourceDbName, targetDbName);
        res.status(200).send({ message: `Database ${sourceDbName} cloned to ${targetDbName}` });
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to clone the database', details: error });
    }
}));
exports.default = router;
