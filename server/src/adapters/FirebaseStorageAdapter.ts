import { IStorageProvider, FileUploadOptions, FileUploadResult } from '../interfaces/IStorageProvider';
import * as admin from 'firebase-admin';
import { Bucket } from '@google-cloud/storage';

export class FirebaseStorageAdapter implements IStorageProvider {
    private bucket: Bucket;

    constructor() {
        this.bucket = admin.storage().bucket();
    }

    async uploadFile(file: Buffer, options: FileUploadOptions): Promise<FileUploadResult> {
        const uploadPath = options.path || 'comics';
        const filename = options.filename || `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const filePath = `${uploadPath}/${filename}`;

        const fileUpload = this.bucket.file(filePath);
        
        const contentType = options.contentType || 'image/jpeg';
        await fileUpload.save(file, {
            contentType,
            public: true
        });

        const [url] = await fileUpload.getSignedUrl({
            action: 'read',
            expires: '03-01-2500' // Long expiration for public content
        });

        return {
            url,
            path: filePath,
            filename
        };
    }

    async deleteFile(path: string): Promise<boolean> {
        try {
            await this.bucket.file(path).delete();
            return true;
        } catch {
            return false;
        }
    }

    async getFileUrl(path: string): Promise<string> {
        const [url] = await this.bucket.file(path).getSignedUrl({
            action: 'read',
            expires: '03-01-2500'
        });
        return url;
    }

    async createDirectory(path: string): Promise<boolean> {
        // Firebase Storage doesn't need directory creation
        return true;
    }
} 