// src/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
    type: 'postgres', // atau mysql/sqlite sesuai database kamu
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'password',
    database: 'dbname',
    synchronize: true,
    logging: false,
    entities: [__dirname + '/entities/*.{ts,js}'],
    migrations: [__dirname + '/migrations/*.{ts,js}'],
    subscribers: [],
});
