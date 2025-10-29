"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const createDynamicModelById = (collectionName, schemaDefinition) => {
    if (mongoose_1.models[collectionName]) {
        return mongoose_1.models[collectionName];
    }
    // Añadir configuración para _id como string
    const schema = new mongoose_1.Schema(Object.assign(Object.assign({}, schemaDefinition), { _id: { type: String, required: false } }), { strict: false });
    return (0, mongoose_1.model)(collectionName, schema, collectionName);
};
exports.default = createDynamicModelById;
