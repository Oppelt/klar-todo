// Tiny IndexedDB wrapper — all data stays on the device.
const DB_NAME = 'klar';
const VERSION = 1;
let dbp;

function open() {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const r = indexedDB.open(DB_NAME, VERSION);
      r.onupgradeneeded = () => {
        const d = r.result;
        for (const [name, key] of [['items', 'id'], ['lists', 'id'], ['audio', 'id'], ['meta', 'key']]) {
          if (!d.objectStoreNames.contains(name)) d.createObjectStore(name, { keyPath: key });
        }
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  return dbp;
}

async function run(store, mode, fn) {
  const d = await open();
  return new Promise((resolve, reject) => {
    const t = d.transaction(store, mode);
    const req = fn(t.objectStore(store));
    let out;
    if (req) req.onsuccess = () => { out = req.result; };
    t.oncomplete = () => resolve(out);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const db = {
  all: (s) => run(s, 'readonly', (st) => st.getAll()),
  get: (s, k) => run(s, 'readonly', (st) => st.get(k)),
  put: (s, v) => run(s, 'readwrite', (st) => st.put(v)),
  del: (s, k) => run(s, 'readwrite', (st) => st.delete(k)),
  clear: (s) => run(s, 'readwrite', (st) => st.clear()),
};
