import { IAuthProvider } from '../interfaces/IAuthProvider';
import { PhoneAuthAdapter } from '../adapters/PhoneAuthAdapter';

export type AuthProviderType = 'phone';

export class AuthProviderFactory {
    private static providers: Map<AuthProviderType, IAuthProvider> = new Map();

    static getProvider(type: AuthProviderType): IAuthProvider {
        let provider = this.providers.get(type);

        if (!provider) {
            switch (type) {
                case 'phone':
                    provider = new PhoneAuthAdapter();
                    break;
                default:
                    throw new Error(`Unsupported auth provider type: ${type}`);
            }
            this.providers.set(type, provider);
        }

        return provider;
    }
} 