/**
 * LM Nutrition — Wrapper IndexedDB
 * API Promise-based sobre IndexedDB nativo.
 * Ningún módulo fuera de /storage debe llamar indexedDB directamente.
 */

import { DB_NAME, DB_VERSION, STORES } from './schema.js';

class Database {
  constructor() {
    this._db    = null;
    this._ready = this._open();
  }

  _open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        for (const store of STORES) {
          if (db.objectStoreNames.contains(store.name)) continue;
          const os = db.createObjectStore(store.name, {
            keyPath: store.keyPath,
            autoIncrement: store.autoIncrement ?? false
          });
          for (const idx of (store.indexes || [])) {
            os.createIndex(idx.name, idx.keyPath, { unique: idx.unique ?? false });
          }
        }
      };

      req.onsuccess = (e) => {
        this._db = e.target.result;
        this._db.onversionchange = () => { this._db.close(); location.reload(); };
        resolve(this._db);
      };

      req.onerror   = () => reject(req.error);
      req.onblocked = () => console.warn('[DB] Upgrade bloqueado por otra pestaña');
    });
  }

  async _db_() {
    if (this._db) return this._db;
    return this._ready;
  }

  _req(r) {
    return new Promise((res, rej) => {
      r.onsuccess = () => res(r.result);
      r.onerror   = () => rej(r.error);
    });
  }

  async _store(name, mode = 'readonly') {
    const db = await this._db_();
    return db.transaction(name, mode).objectStore(name);
  }

  async get(store, key) {
    return this._req((await this._store(store)).get(key));
  }

  async getAll(store, indexName = null, query = null) {
    const s = await this._store(store);
    return this._req(indexName ? s.index(indexName).getAll(query) : s.getAll(query));
  }

  async getByIndex(store, indexName, value) {
    const s = await this._store(store);
    return this._req(s.index(indexName).getAll(IDBKeyRange.only(value)));
  }

  async getByDateRange(store, from, to) {
    const s = await this._store(store);
    return this._req(s.index('by-date').getAll(IDBKeyRange.bound(from, to)));
  }

  async put(store, record) {
    return this._req((await this._store(store, 'readwrite')).put(record));
  }

  async add(store, record) {
    return this._req((await this._store(store, 'readwrite')).add(record));
  }

  async delete(store, key) {
    return this._req((await this._store(store, 'readwrite')).delete(key));
  }

  async clear(store) {
    return this._req((await this._store(store, 'readwrite')).clear());
  }

  async count(store) {
    return this._req((await this._store(store)).count());
  }

  async putMany(store, records) {
    if (!records.length) return [];
    const db = await this._db_();
    const tx = db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    return new Promise((res, rej) => {
      const results = [];
      let n = records.length;
      for (const r of records) {
        const req = os.put(r);
        req.onsuccess = () => { results.push(req.result); if (--n === 0) res(results); };
        req.onerror   = () => rej(req.error);
      }
    });
  }

  /** Hook para futura sincronización cloud — no-op por ahora */
  async sync(_store, _key) { return Promise.resolve(); }

  async exportAll() {
    const out = {};
    for (const s of STORES) out[s.name] = await this.getAll(s.name);
    return out;
  }

  async importAll(data) {
    for (const [store, records] of Object.entries(data)) {
      await this.clear(store);
      if (Array.isArray(records) && records.length) await this.putMany(store, records);
    }
  }
}

export const db = new Database();
