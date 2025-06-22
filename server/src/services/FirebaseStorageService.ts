import * as admin from 'firebase-admin';
import { Bucket } from '@google-cloud/storage';

export class FirebaseStorageService {
    private bucket: Bucket;

    constructor() {
        this.bucket = admin.storage().bucket();
    }

    async upload(file: Buffer, filePath: string, contentType: string): Promise<string> {
        const fileUpload = this.bucket.file(filePath);
        await fileUpload.save(file, {
            contentType,
            public: true
        });
        const [url] = await fileUpload.getSignedUrl({
            action: 'read',
            expires: '03-01-2500'
        });
        return url;
    }

    async delete(filePath: string): Promise<boolean> {
        try {
            await this.bucket.file(filePath).delete();
            return true;
        } catch {
            return false;
        }
    }

    async getUrl(filePath: string): Promise<string> {
        const [url] = await this.bucket.file(filePath).getSignedUrl({
            action: 'read',
            expires: '03-01-2500'
        });
        return url;
    }
} 