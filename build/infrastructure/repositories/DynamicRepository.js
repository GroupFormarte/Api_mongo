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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicRepository = void 0;
const DynamicModelFactory_1 = require("../factories/DynamicModelFactory");
class DynamicRepository {
    constructor() {
        this.modelFactory = DynamicModelFactory_1.DynamicModelFactory.getInstance();
    }
    getModel(collectionName, schema = {}, options = {}) {
        return this.modelFactory.getModel(collectionName, schema, options);
    }
    findById(collectionName_1, id_1) {
        return __awaiter(this, arguments, void 0, function* (collectionName, id, schema = {}) {
            const model = this.getModel(collectionName, schema);
            return yield model.findById(id);
        });
    }
    findOne(collectionName_1, query_1) {
        return __awaiter(this, arguments, void 0, function* (collectionName, query, schema = {}) {
            const model = this.getModel(collectionName, schema);
            return yield model.findOne(query);
        });
    }
    find(collectionName_1) {
        return __awaiter(this, arguments, void 0, function* (collectionName, query = {}, projection = {}, schema = {}) {
            const model = this.getModel(collectionName, schema);
            return yield model.find(query, projection);
        });
    }
    findByIds(collectionName_1, ids_1) {
        return __awaiter(this, arguments, void 0, function* (collectionName, ids, schema = {}) {
            const model = this.getModel(collectionName, schema);
            return yield model.find({ _id: { $in: ids } });
        });
    }
    create(collectionName_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (collectionName, data, schema = {}) {
            const model = this.getModel(collectionName, schema);
            const document = new model(data);
            return yield document.save();
        });
    }
    updateById(collectionName_1, id_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (collectionName, id, data, schema = {}) {
            const model = this.getModel(collectionName, schema, { useById: true });
            return yield model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        });
    }
    partialUpdateById(collectionName_1, id_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (collectionName, id, data, schema = {}) {
            const model = this.getModel(collectionName, schema, { useById: true });
            return yield model.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
        });
    }
    updateOne(collectionName_1, query_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (collectionName, query, data, schema = {}) {
            const model = this.getModel(collectionName, schema);
            return yield model.findOneAndUpdate(query, { $set: data }, { new: true });
        });
    }
    deleteById(collectionName_1, id_1) {
        return __awaiter(this, arguments, void 0, function* (collectionName, id, schema = {}) {
            const model = this.getModel(collectionName, schema);
            return yield model.findByIdAndDelete(id);
        });
    }
    bulkUpdate(collectionName_1, students_1) {
        return __awaiter(this, arguments, void 0, function* (collectionName, students, schema = {}) {
            const model = this.getModel(collectionName, schema);
            const updated = [];
            const notFound = [];
            for (const student of students) {
                const { id_estudiante } = student, rest = __rest(student, ["id_estudiante"]);
                if (!id_estudiante)
                    continue;
                const result = yield model.findOneAndUpdate({ id_estudiante }, { $set: rest }, { new: true });
                if (result) {
                    updated.push(result);
                }
                else {
                    notFound.push(id_estudiante);
                }
            }
            return { updated, notFound };
        });
    }
    bulkCreateUnique(collectionName_1, students_1) {
        return __awaiter(this, arguments, void 0, function* (collectionName, students, schema = {}) {
            const model = this.getModel(collectionName, schema);
            const ids = students.map((s) => s.id_estudiante);
            const existing = yield model.find({ id_estudiante: { $in: ids } }).lean();
            const existingIds = new Set(existing.map((e) => e.id_estudiante));
            const toInsert = students
                .filter((s) => !existingIds.has(s.id_estudiante))
                .map((s) => {
                const clean = Object.assign({}, s);
                if (clean.id === null || clean.id === undefined) {
                    delete clean.id;
                }
                return clean;
            });
            let created = [];
            if (toInsert.length > 0) {
                created = yield model.insertMany(toInsert);
            }
            return { created, existing };
        });
    }
    searchByField(collectionName_1, field_1, value_1) {
        return __awaiter(this, arguments, void 0, function* (collectionName, field, value, schema = {}) {
            const model = this.getModel(collectionName, schema);
            const query = { [field]: value };
            return yield model.find(query);
        });
    }
    multiFieldSearch(collectionName_1, query_1, fields_1) {
        return __awaiter(this, arguments, void 0, function* (collectionName, query, fields, schema = {}) {
            const model = this.getModel(collectionName, schema);
            const searchPromises = fields.map(field => model.find({ [field]: new RegExp(query, 'i') }));
            const results = yield Promise.all(searchPromises);
            return results.flat();
        });
    }
    findByCategory(collectionName_1, category_1) {
        return __awaiter(this, arguments, void 0, function* (collectionName, category, schema = {}) {
            const model = this.getModel(collectionName, schema);
            return yield model.find({ category });
        });
    }
    // New utility methods
    getCacheStats() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.modelFactory.getCacheStats();
        });
    }
    getCollectionStats(collectionName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.modelFactory.getCollectionStats(collectionName);
        });
    }
    invalidateCache(collectionName) {
        return __awaiter(this, void 0, void 0, function* () {
            this.modelFactory.invalidateCache(collectionName);
        });
    }
    preloadModels(collections) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.modelFactory.preloadModels(collections);
        });
    }
    /**
     * Update a specific student's answers within a simulation without affecting other students
     * Uses intelligent merge: updates existing questions and adds new ones without removing old answers
     * @param collectionName - The collection name (e.g., 'assigned_simulation')
     * @param documentId - The main document _id
     * @param simulacroId - The id_simulacro within simulacros_asignados array
     * @param userId - The userId of the student to update
     * @param updates - Object containing the fields to update (sectionOne, sectionTwo, etc.)
     * @param schema - Optional schema definition
     * @returns The updated document or null if not found
     */
    updateStudentAnswers(collectionName_1, documentId_1, simulacroId_1, userId_1, updates_1) {
        return __awaiter(this, arguments, void 0, function* (collectionName, documentId, simulacroId, userId, updates, schema = {}) {
            var _a, _b;
            const model = this.getModel(collectionName, schema);
            // First, get the current document to perform intelligent merge
            const currentDoc = yield model.findById(documentId);
            if (!currentDoc) {
                return null;
            }
            // Find the specific simulacro and student
            const simulacro = (_a = currentDoc.simulacros_asignados) === null || _a === void 0 ? void 0 : _a.find((s) => s.id_simulacro === simulacroId);
            if (!simulacro) {
                return null;
            }
            const studentIndex = (_b = simulacro.resultados_estudiantes) === null || _b === void 0 ? void 0 : _b.findIndex((st) => st.userId === userId);
            if (studentIndex === -1) {
                return null;
            }
            const currentStudent = simulacro.resultados_estudiantes[studentIndex];
            // Build the merged update object
            const setObject = {};
            for (const [sectionKey, newAnswers] of Object.entries(updates)) {
                // Only process array fields (sectionOne, sectionTwo, etc.)
                if (Array.isArray(newAnswers)) {
                    const currentAnswers = currentStudent[sectionKey] || [];
                    // Create a map of existing answers by question number for quick lookup
                    const answersMap = new Map();
                    currentAnswers.forEach((ans) => {
                        if (ans.question !== undefined && ans.question !== null) {
                            answersMap.set(ans.question, ans);
                        }
                    });
                    // Update or add new answers based on question number
                    newAnswers.forEach((newAns) => {
                        if (newAns.question !== undefined && newAns.question !== null) {
                            answersMap.set(newAns.question, newAns);
                        }
                    });
                    // Convert map back to array
                    const mergedAnswers = Array.from(answersMap.values());
                    setObject[`simulacros_asignados.$[sim].resultados_estudiantes.$[student].${sectionKey}`] = mergedAnswers;
                }
                else {
                    // For non-array fields, just set them directly
                    setObject[`simulacros_asignados.$[sim].resultados_estudiantes.$[student].${sectionKey}`] = newAnswers;
                }
            }
            // Perform the update with arrayFilters
            const result = yield model.findByIdAndUpdate(documentId, { $set: setObject }, {
                new: true,
                runValidators: true,
                arrayFilters: [
                    { 'sim.id_simulacro': simulacroId },
                    { 'student.userId': userId }
                ]
            });
            return result;
        });
    }
    /**
     * Update or create a student's answers by searching with custom query field
     * Receives flat JSON with student data and answers mixed
     * If student doesn't exist: creates it with all data
     * If student exists: only updates sectionOne/sectionTwo (ignores other fields)
     * @param collectionName - The collection name (e.g., 'assigned_simulation')
     * @param queryField - The field to search by (e.g., 'id_instituto')
     * @param queryValue - The value to search for
     * @param simulacroId - The id_simulacro within simulacros_asignados array
     * @param flatData - Flat object containing both student data and answers
     * @param schema - Optional schema definition
     * @returns The updated document or null if not found
     */
    updateOrCreateStudentAnswersByQuery(collectionName_1, queryField_1, queryValue_1, simulacroId_1, flatData_1) {
        return __awaiter(this, arguments, void 0, function* (collectionName, queryField, queryValue, simulacroId, flatData, schema = {}) {
            var _a, _b;
            const model = this.getModel(collectionName, schema);
            // Find the document by custom query field
            const currentDoc = yield model.findOne({ [queryField]: queryValue });
            if (!currentDoc) {
                return null;
            }
            // Find the specific simulacro
            const simulacroIndex = (_a = currentDoc.simulacros_asignados) === null || _a === void 0 ? void 0 : _a.findIndex((s) => s.id_simulacro === simulacroId);
            if (simulacroIndex === -1) {
                return null;
            }
            // Extract userId from flatData
            const userId = flatData.userId;
            if (!userId) {
                throw new Error('userId is required in the request body');
            }
            // Separate answer fields from student data fields
            const answerFields = ['sectionOne', 'sectionTwo'];
            const answers = {};
            const studentData = {};
            for (const [key, value] of Object.entries(flatData)) {
                if (answerFields.includes(key)) {
                    answers[key] = value;
                }
                else {
                    studentData[key] = value;
                }
            }
            // Find or create the student
            const studentIndex = (_b = currentDoc.simulacros_asignados[simulacroIndex].resultados_estudiantes) === null || _b === void 0 ? void 0 : _b.findIndex((st) => st.userId === userId);
            if (studentIndex === -1) {
                // Student doesn't exist, create it with ALL data (student data + answers)
                const newStudent = Object.assign(Object.assign({}, studentData), { sectionOne: answers.sectionOne || [], sectionTwo: answers.sectionTwo || [] });
                const result = yield model.findOneAndUpdate({ [queryField]: queryValue, 'simulacros_asignados.id_simulacro': simulacroId }, {
                    $push: {
                        'simulacros_asignados.$.resultados_estudiantes': newStudent
                    }
                }, { new: true, runValidators: false });
                return result;
            }
            // Student exists, perform intelligent merge ONLY on sectionOne/sectionTwo
            const currentStudent = currentDoc.simulacros_asignados[simulacroIndex].resultados_estudiantes[studentIndex];
            const setObject = {};
            for (const [sectionKey, newAnswers] of Object.entries(answers)) {
                if (Array.isArray(newAnswers)) {
                    const currentAnswers = currentStudent[sectionKey] || [];
                    // Create a map of existing answers by question number for quick lookup
                    const answersMap = new Map();
                    currentAnswers.forEach((ans) => {
                        if (ans.question !== undefined && ans.question !== null) {
                            answersMap.set(ans.question, ans);
                        }
                    });
                    // Update or add new answers based on question number
                    newAnswers.forEach((newAns) => {
                        if (newAns.question !== undefined && newAns.question !== null) {
                            answersMap.set(newAns.question, newAns);
                        }
                    });
                    // Convert map back to array
                    const mergedAnswers = Array.from(answersMap.values());
                    setObject[`simulacros_asignados.$[sim].resultados_estudiantes.$[student].${sectionKey}`] = mergedAnswers;
                }
            }
            // Perform the update with arrayFilters (ONLY updates answers, ignores student data)
            const result = yield model.findOneAndUpdate({ [queryField]: queryValue }, { $set: setObject }, {
                new: true,
                runValidators: false,
                arrayFilters: [
                    { 'sim.id_simulacro': simulacroId },
                    { 'student.userId': userId }
                ]
            });
            return result;
        });
    }
}
exports.DynamicRepository = DynamicRepository;
