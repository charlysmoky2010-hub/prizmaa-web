declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(filename: string);
    exec(sql: string): void;
    prepare(sql: string): { run(...args: (string|number|null)[]): unknown; get(...args: (string|number|null)[]): Record<string,unknown>|undefined; all(...args: (string|number|null)[]): Record<string,unknown>[] };
  }
}
