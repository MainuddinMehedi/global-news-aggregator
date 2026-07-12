declare module "lru-cache" {
  export class LRUCache<K, V> {
    constructor(options: { max?: number; ttl?: number });
    get(key: K): V | undefined;
    set(key: K, value: V): void;
    delete(key: K): void;
    clear(): void;
  }
}
