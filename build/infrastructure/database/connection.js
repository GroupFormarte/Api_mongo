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
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../../shared/config/env");
class DatabaseConnection {
    constructor() {
        this.isConnected = false;
    }
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isConnected) {
                return;
            }
            try {
                const mongoDB = env_1.env.mongoUri || '';
                if (!mongoDB) {
                    throw new Error('MONGO_URI environment variable is not defined');
                }
                yield mongoose_1.default.connect(mongoDB);
                this.isConnected = true;
                console.log('\nConnected to MongoDB');
            }
            catch (error) {
                console.error('Error connecting to MongoDB:', error);
                throw error;
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isConnected) {
                return;
            }
            try {
                yield mongoose_1.default.disconnect();
                this.isConnected = false;
                console.log('Disconnected from MongoDB');
            }
            catch (error) {
                console.error('Error disconnecting from MongoDB:', error);
                throw error;
            }
        });
    }
    getConnection() {
        if (!this.isConnected) {
            throw new Error('Database is not connected');
        }
        return mongoose_1.default;
    }
    isDbConnected() {
        return this.isConnected;
    }
}
exports.default = DatabaseConnection;
