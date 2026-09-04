import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'campusos.db');

console.log('Testing better-sqlite3 connection to:', DB_PATH);
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Check tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Existing tables before init:', tables.map(t => t.name));

// Now run dynamic import of ts-compiled or run node to test lib/db
