import { IStorageProvider, FileUploadOptions, FileUploadResult } from '../interfaces/IStorageProvider';
import { FirebaseStorageService } from '../services/FirebaseStorageService';

export class FirebaseStorageAdapter implements IStorageProvider {
    private service: FirebaseStorageService;

    constructor() {
        this.service = new FirebaseStorageService();
    }

    async uploadFile(file: Buffer, options: FileUploadOptions): Promise<FileUploadResult> {
        const uploadPath = options.path || 'comics';
        const filename = options.filename || `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const filePath = `${uploadPath}/${filename}`;
        const contentType = options.contentType || 'image/jpeg';

        const url = await this.service.upload(file, filePath, contentType);

        return {
            url,
            path: filePath,
            filename
        };
    }

    async deleteFile(path: string): Promise<boolean> {
        return this.service.delete(path);
    }

    async getFileUrl(path: string): Promise<string> {
        return this.service.getUrl(path);
    }

    async createDirectory(path: string): Promise<boolean> {
        return true;
    }
} 