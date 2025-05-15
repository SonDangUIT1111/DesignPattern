export interface AuthUser {
    id?: string;
    phone?: string;
    email?: string;
    username: string;
    avatar: string;
    coinPoint: number;
    questLog: {
        readingTime: number;
        watchingTime: number;
        received: string[];
        finalTime: Date;
        hasReceivedDailyGift: boolean;
    };
}

export interface LoginCredentials {
    phone?: string;
    email?: string;
    password?: string;
    token?: string;
}

export interface RegisterData {
    phone?: string;
    email?: string;
    password?: string;
    username?: string;
}

export interface IAuthProvider {
    login(credentials: LoginCredentials): Promise<AuthUser>;
    register(data: RegisterData): Promise<AuthUser>;
    verify(token: string): Promise<boolean>;
    generateToken(userId: string): Promise<string>;
    validateToken(token: string): Promise<string | null>; // returns userId if valid
} 