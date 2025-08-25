"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const User_1 = require("../entities/User");
const Event_1 = require("../entities/Event");
const Participant_1 = require("../entities/Participant");
const KategoriKegiatan_1 = require("../entities/KategoriKegiatan");
const EventPackage_1 = require("../entities/EventPackage");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
let databaseConfig;
if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    databaseConfig = {
        type: "postgres",
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        username: url.username,
        password: url.password,
        database: url.pathname.substring(1),
        ssl: {
            rejectUnauthorized: false
        }
    };
}
else {
    databaseConfig = {
        type: "postgres",
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432"),
        username: process.env.DB_USERNAME || "postgres",
        password: process.env.DB_PASSWORD || "password",
        database: process.env.DB_DATABASE || "kapanggih",
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
        } : false
    };
}
const AppDataSource = new typeorm_1.DataSource({
    ...databaseConfig,
    entities: [User_1.User, Event_1.Event, Participant_1.Participant, KategoriKegiatan_1.KategoriKegiatan, EventPackage_1.EventPackage],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    migrations: [],
    subscribers: [],
    extra: {
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000,
    }
});
exports.default = AppDataSource;
//# sourceMappingURL=database.js.map