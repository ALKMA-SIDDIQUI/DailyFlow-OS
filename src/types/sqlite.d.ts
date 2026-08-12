declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(location: string, options?: { open?: boolean });
    exec(sql: string): void;
    prepare(sql: string): {
      get(...params: unknown[]): unknown;
      all(...params: unknown[]): unknown[];
      run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
    };
    close(): void;
  }
}
