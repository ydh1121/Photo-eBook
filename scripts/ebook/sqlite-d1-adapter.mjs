import {DatabaseSync} from 'node:sqlite';

// Local integration adapter uses actual SQLite BLOBs and SQL semantics.
// It is never presented as a remote D1 execution or account-plan proof.
export function openLocalD1(filename = ':memory:') {
  const sqlite = new DatabaseSync(filename);
  const adapter = {
    sqlite,
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      const wrap = values => ({
        bind: (...args) => wrap(args),
        async first() { return statement.get(...values) ?? null; },
        async all() { return {results: statement.all(...values), success: true}; },
        async run() { const result = statement.run(...values); return {success: true, meta: {changes: Number(result.changes)}}; }
      });
      return wrap([]);
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try { const result = []; for (const statement of statements) result.push(await statement.run()); sqlite.exec('COMMIT'); return result; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
    close() { sqlite.close(); }
  };
  return adapter;
}
