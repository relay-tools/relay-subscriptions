declare module RelayMetaRoute {
  declare class RelayMetaRoute {
    name: string;
    constructor(name: string): void;
    static get(name: string): RelayMetaRoute;
  }
}
