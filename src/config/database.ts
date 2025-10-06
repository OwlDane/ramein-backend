import { DataSource, DataSourceOptions } from "typeorm";
import { User } from "../entities/User";
import { Event } from "../entities/Event";
import { Participant } from "../entities/Participant";
import { KategoriKegiatan } from "../entities/KategoriKegiatan";
import { Certificate } from "../entities/Certificate";
import { CertificateTemplate } from "../entities/CertificateTemplate";
import * as dotenv from 'dotenv';

dotenv.config();

// Database configuration using Supabase connection pooler (working configuration)
const databaseConfig: DataSourceOptions = {
    type: "postgres",
    host: "aws-1-ap-southeast-1.pooler.supabase.com",
    port: 6543,
    username: "postgres.rofxhgqffyrhencqffal",
    password: "HisbBf4tBEnbTInu",
    database: "postgres",
    ssl: {
        rejectUnauthorized: false
    },
    entities: [User, Event, Participant, KategoriKegiatan, Certificate, CertificateTemplate],
    synchronize: false, // Disable synchronize to prevent conflicts with existing data
    logging: ["error", "warn"],
    migrations: ["src/config/migrations/*.ts"],
    subscribers: [],
    extra: {
        // Connection pooler settings
        max: 10,
        min: 2,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
        
        // Query timeout
        statement_timeout: 30000,
        query_timeout: 30000,
        
        // Connection settings
        connectionTimeoutMillis: 30000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000
    }
};

const AppDataSource = new DataSource(databaseConfig);

export default AppDataSource;