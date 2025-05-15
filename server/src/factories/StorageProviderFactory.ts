import { IStorageProvider } from '../interfaces/IStorageProvider';
import { FirebaseStorageAdapter } from '../adapters/FirebaseStorageAdapter';

export class StorageProviderFactory {
    private static provider: IStorageProvider | null = null;

    static getProvider(): IStorageProvider {
        if (!this.provider) {
            this.provider = new FirebaseStorageAdapter();
        }
        return this.provider;
    }
} 