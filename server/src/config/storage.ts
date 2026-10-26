import path from 'path';
import fs from 'fs';
import { env } from './env';

// Storage abstraction — supports local and future S3-compatible backends
export interface StorageProvider {
  save(key: string, data: Buffer | string): Promise<string>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
  exists(key: string): Promise<boolean>;
}

class LocalStorageProvider implements StorageProvider {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = path.resolve(basePath);
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const dirs = ['videos', 'audio', 'renders', 'thumbnails', 'uploads', 'music'];
    dirs.forEach((dir) => {
      fs.mkdirSync(path.join(this.basePath, dir), { recursive: true });
    });
  }

  private fullPath(key: string) {
    return path.join(this.basePath, key);
  }

  async save(key: string, data: Buffer | string): Promise<string> {
    const fullPath = this.fullPath(key);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, data);
    return key;
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFileSync(this.fullPath(key));
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.fullPath(key);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  getUrl(key: string): string {
    return `/api/files/${key.replace(/\\/g, '/')}`;
  }

  async exists(key: string): Promise<boolean> {
    return fs.existsSync(this.fullPath(key));
  }

  getFullPath(key: string): string {
    return this.fullPath(key);
  }
}

export const storage = new LocalStorageProvider(env.LOCAL_STORAGE_PATH);
export const storagePath = path.resolve(env.LOCAL_STORAGE_PATH);
