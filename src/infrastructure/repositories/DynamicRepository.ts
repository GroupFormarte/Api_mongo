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
}