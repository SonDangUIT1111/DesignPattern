export interface AuthStrategy {
  authenticate(credentials: any): Promise<AuthResult>;
  getProviderName(): string;
  isAvailable(): boolean;
}

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
  redirectUrl?: string;
}

export interface AuthCredentials {
  [key: string]: any;
} 