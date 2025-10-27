import { Document, Model } from 'mongoose';
import { DynamicModelFactory, ModelOptions } from '../factories/DynamicModelFactory';

export interface BulkUpdateResult {
  updated: any[];
  notFound: any[];
}

export interface BulkCreateResult {
  created: any[];
  existing: any[];
}

export class DynamicRepository {
  private modelFactory: DynamicModelFactory;

  constructor() {
    this.modelFactory = DynamicModelFactory.getInstance();
  }

  private getModel(collectionName: string, schema: any = {}, options: ModelOptions = {}): Model<any> {
    return this.modelFactory.getModel(collectionName, schema, options);
  }

  async findById(collectionName: string, id: string, schema: any = {}): Promise<any | null> {
    const model = this.getModel(collectionName, schema);
    return await model.findById(id);
  }

  async findOne(collectionName: string, query: any, schema: any = {}): Promise<any | null> {
    const model = this.getModel(collectionName, schema);
    return await model.findOne(query);
  }

  async find(collectionName: string, query: any = {}, projection: any = {}, schema: any = {}): Promise<any[]> {
    const model = this.getModel(collectionName, schema);
    return await model.find(query, projection);
  }

  async findByIds(collectionName: string, ids: string[], schema: any = {}): Promise<any[]> {
    const model = this.getModel(collectionName, schema);
    return await model.find({ _id: { $in: ids } });
  }

  async create(collectionName: string, data: any, schema: any = {}): Promise<any> {
    const model = this.getModel(collectionName, schema);
    const document = new model(data);
    return await document.save();
  }

  async updateById(collectionName: string, id: string, data: any, schema: any = {}): Promise<any | null> {
    const model = this.getModel(collectionName, schema, { useById: true });
    return await model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async partialUpdateById(collectionName: string, id: string, data: any, schema: any = {}): Promise<any | null> {
    const model = this.getModel(collectionName, schema, { useById: true });
    return await model.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  async updateOne(collectionName: string, query: any, data: any, schema: any = {}): Promise<any | null> {
    const model = this.getModel(collectionName, schema);
    return await model.findOneAndUpdate(query, { $set: data }, { new: true });
  }

  async deleteById(collectionName: string, id: string, schema: any = {}): Promise<any | null> {
    const model = this.getModel(collectionName, schema);
    return await model.findByIdAndDelete(id);
  }

  async bulkUpdate(collectionName: string, students: any[], schema: any = {}): Promise<BulkUpdateResult> {
    const model = this.getModel(collectionName, schema);
    const updated: any[] = [];
    const notFound: any[] = [];

    for (const student of students) {
      const { id_estudiante, ...rest } = student;
      if (!id_estudiante) continue;

      const result = await model.findOneAndUpdate(
        { id_estudiante },
        { $set: rest },
        { new: true }
      );

      if (result) {
        updated.push(result);
      } else {
        notFound.push(id_estudiante);
      }
    }

    return { updated, notFound };
  }

  async bulkCreateUnique(collectionName: string, students: any[], schema: any = {}): Promise<BulkCreateResult> {
    const model = this.getModel(collectionName, schema);
    const ids = students.map((s: any) => s.id_estudiante);

    const existing = await model.find({ id_estudiante: { $in: ids } }).lean();
    const existingIds = new Set(existing.map((e: any) => e.id_estudiante));

    const toInsert = students
      .filter((s: any) => !existingIds.has(s.id_estudiante))
      .map((s: any) => {
        const clean = { ...s };
        if (clean.id === null || clean.id === undefined) {
          delete clean.id;
        }
        return clean;
      });

    let created: any[] = [];
    if (toInsert.length > 0) {
      created = await model.insertMany(toInsert);
    }

    return { created, existing };
  }

  async searchByField(collectionName: string, field: string, value: string, schema: any = {}): Promise<any[]> {
    const model = this.getModel(collectionName, schema);
    const query = { [field]: value };
    return await model.find(query);
  }

  async multiFieldSearch(collectionName: string, query: string, fields: string[], schema: any = {}): Promise<any[]> {
    const model = this.getModel(collectionName, schema);
    const searchPromises = fields.map(field =>
      model.find({ [field]: new RegExp(query, 'i') })
    );
    const results = await Promise.all(searchPromises);
    return results.flat();
  }

  async findByCategory(collectionName: string, category: string, schema: any = {}): Promise<any[]> {
    const model = this.getModel(collectionName, schema);
    return await model.find({ category });
  }

  // New utility methods
  async getCacheStats() {
    return this.modelFactory.getCacheStats();
  }

  async getCollectionStats(collectionName: string) {
    return await this.modelFactory.getCollectionStats(collectionName);
  }

  async invalidateCache(collectionName?: string) {
    this.modelFactory.invalidateCache(collectionName);
  }

  async preloadModels(collections: { name: string; schema?: any; options?: ModelOptions }[]) {
    return await this.modelFactory.preloadModels(collections);
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
  async updateStudentAnswers(
    collectionName: string,
    documentId: string,
    simulacroId: string,
    userId: string,
    updates: {
      sectionOne?: any[];
      sectionTwo?: any[];
      [key: string]: any;
    },
    schema: any = {}
  ): Promise<any | null> {
    const model = this.getModel(collectionName, schema);

    // First, get the current document to perform intelligent merge
    const currentDoc = await model.findById(documentId);

    if (!currentDoc) {
      return null;
    }

    // Find the specific simulacro and student
    const simulacro = currentDoc.simulacros_asignados?.find(
      (s: any) => s.id_simulacro === simulacroId
    );

    if (!simulacro) {
      return null;
    }

    const studentIndex = simulacro.resultados_estudiantes?.findIndex(
      (st: any) => st.userId === userId
    );

    if (studentIndex === -1) {
      return null;
    }

    const currentStudent = simulacro.resultados_estudiantes[studentIndex];

    // Build the merged update object
    const setObject: any = {};

    for (const [sectionKey, newAnswers] of Object.entries(updates)) {
      // Only process array fields (sectionOne, sectionTwo, etc.)
      if (Array.isArray(newAnswers)) {
        const currentAnswers = currentStudent[sectionKey] || [];

        // Create a map of existing answers by question number for quick lookup
        const answersMap = new Map();
        currentAnswers.forEach((ans: any) => {
          if (ans.question !== undefined && ans.question !== null) {
            answersMap.set(ans.question, ans);
          }
        });

        // Update or add new answers based on question number
        newAnswers.forEach((newAns: any) => {
          if (newAns.question !== undefined && newAns.question !== null) {
            answersMap.set(newAns.question, newAns);
          }
        });

        // Convert map back to array
        const mergedAnswers = Array.from(answersMap.values());

        setObject[`simulacros_asignados.$[sim].resultados_estudiantes.$[student].${sectionKey}`] = mergedAnswers;
      } else {
        // For non-array fields, just set them directly
        setObject[`simulacros_asignados.$[sim].resultados_estudiantes.$[student].${sectionKey}`] = newAnswers;
      }
    }

    // Perform the update with arrayFilters
    const result = await model.findByIdAndUpdate(
      documentId,
      { $set: setObject },
      {
        new: true,
        runValidators: true,
        arrayFilters: [
          { 'sim.id_simulacro': simulacroId },
          { 'student.userId': userId }
        ]
      }
    );

    return result;
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
  async updateOrCreateStudentAnswersByQuery(
    collectionName: string,
    queryField: string,
    queryValue: string,
    simulacroId: string,
    flatData: any,
    schema: any = {}
  ): Promise<any | null> {
    const model = this.getModel(collectionName, schema);

    // Find the document by custom query field
    const currentDoc = await model.findOne({ [queryField]: queryValue });

    if (!currentDoc) {
      return null;
    }

    // Find the specific simulacro
    const simulacroIndex = currentDoc.simulacros_asignados?.findIndex(
      (s: any) => s.id_simulacro === simulacroId
    );

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
    const answers: any = {};
    const studentData: any = {};

    for (const [key, value] of Object.entries(flatData)) {
      if (answerFields.includes(key)) {
        answers[key] = value;
      } else {
        studentData[key] = value;
      }
    }

    // Find or create the student
    const studentIndex = currentDoc.simulacros_asignados[simulacroIndex].resultados_estudiantes?.findIndex(
      (st: any) => st.userId === userId
    );

    if (studentIndex === -1) {
      // Student doesn't exist, create it with ALL data (student data + answers)
      const newStudent = {
        ...studentData,
        sectionOne: answers.sectionOne || [],
        sectionTwo: answers.sectionTwo || []
      };

      const result = await model.findOneAndUpdate(
        { [queryField]: queryValue, 'simulacros_asignados.id_simulacro': simulacroId },
        {
          $push: {
            'simulacros_asignados.$.resultados_estudiantes': newStudent
          }
        },
        { new: true, runValidators: false }
      );

      return result;
    }

    // Student exists, perform intelligent merge ONLY on sectionOne/sectionTwo
    const currentStudent = currentDoc.simulacros_asignados[simulacroIndex].resultados_estudiantes[studentIndex];
    const setObject: any = {};

    for (const [sectionKey, newAnswers] of Object.entries(answers)) {
      if (Array.isArray(newAnswers)) {
        const currentAnswers = currentStudent[sectionKey] || [];

        // Create a map of existing answers by question number for quick lookup
        const answersMap = new Map();
        currentAnswers.forEach((ans: any) => {
          if (ans.question !== undefined && ans.question !== null) {
            answersMap.set(ans.question, ans);
          }
        });

        // Update or add new answers based on question number
        newAnswers.forEach((newAns: any) => {
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
    const result = await model.findOneAndUpdate(
      { [queryField]: queryValue },
      { $set: setObject },
      {
        new: true,
        runValidators: false,
        arrayFilters: [
          { 'sim.id_simulacro': simulacroId },
          { 'student.userId': userId }
        ]
      }
    );

    return result;
  }
}