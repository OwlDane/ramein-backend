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
const Certificate_1 = require("../entities/Certificate");
const CertificateTemplate_1 = require("../entities/CertificateTemplate");
const Transaction_1 = require("../entities/Transaction");
const Article_1 = require("../entities/Article");
const ArticleCategory_1 = require("../entities/ArticleCategory");
const Testimonial_1 = require("../entities/Testimonial");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const databaseConfig = {
    type: "postgres",
    host: "aws-1-ap-southeast-1.pooler.supabase.com",
    port: 6543,
    username: "postgres.rofxhgqffyrhencqffal",
    password: "HisbBf4tBEnbTInu",
    database: "postgres",
    ssl: {
        rejectUnauthorized: false,
    },
    entities: [
        User_1.User,
        Event_1.Event,
        Participant_1.Participant,
        KategoriKegiatan_1.KategoriKegiatan,
        Certificate_1.Certificate,
        CertificateTemplate_1.CertificateTemplate,
        Transaction_1.Transaction,
        Article_1.Article,
        ArticleCategory_1.ArticleCategory,
        Testimonial_1.Testimonial,
    ],
    synchronize: false,
    logging: ["error", "warn"],
    migrations: ["src/config/migrations/*.ts"],
    migrationsTableName: 'migrations',
    subscribers: [],
    extra: {
        max: 10,
        min: 2,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
        statement_timeout: 30000,
        query_timeout: 30000,
        connectionTimeoutMillis: 30000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
    },
};
const AppDataSource = new typeorm_1.DataSource(databaseConfig);
exports.default = AppDataSource;
//# sourceMappingURL=database.js.map