import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Event } from "../entities/Event";
import { Participant } from "../entities/Participant";
import { KategoriKegiatan } from "../entities/KategoriKegiatan";

import { EventPackage } from "../entities/EventPackage";
import * as dotenv from 'dotenv';

dotenv.config();

// Parse DATABASE_URL if available, otherwise use individual config
let databaseConfig: any;

if (process.env.DATABASE_URL) {
    // Parse DATABASE_URL format: postgresql://username:password@host:port/database
    const url = new URL(process.env.DATABASE_URL);
    databaseConfig = {
        type: "postgres",
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        username: url.username,
        password: url.password,
        database: url.pathname.substring(1), // Remove leading slash
        ssl: {
            rejectUnauthorized: false
        }
    };
} else {
    // Fallback to individual environment variables
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

const AppDataSource = new DataSource({
    ...databaseConfig,
    entities: [User, Event, Participant, KategoriKegiatan, EventPackage],
    synchronize: process.env.NODE_ENV !== 'production', // Only sync in development
    logging: process.env.NODE_ENV === 'development',
    migrations: [],
    subscribers: [],
    // Connection pool settings
    extra: {
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000,
    }
});

export default AppDataSource;
