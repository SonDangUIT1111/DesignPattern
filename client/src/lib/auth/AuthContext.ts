import { AuthStrategy, AuthResult, AuthCredentials } from "./strategies/AuthStrategy";
import { PhoneAuthStrategy } from "./strategies/PhoneAuthStrategy";
import { FacebookAuthStrategy } from "./strategies/FacebookAuthStrategy";
import { GoogleAuthStrategy } from "./strategies/GoogleAuthStrategy";

export type AuthProvider = "phone" | "facebook" | "google";

export class AuthContext {
  private strategies: Map<AuthProvider, AuthStrategy>;
  private currentStrategy: AuthStrategy | null = null;

  constructor() {
    this.strategies = new Map();
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    // Register all available strategies
    this.strategies.set("phone", new PhoneAuthStrategy());
    this.strategies.set("facebook", new FacebookAuthStrategy());
    this.strategies.set("google", new GoogleAuthStrategy());
  }

  public setStrategy(provider: AuthProvider): boolean {
    const strategy = this.strategies.get(provider);
    if (!strategy) {
      console.error(`Authentication strategy '${provider}' not found`);
      return false;
    }

    if (!strategy.isAvailable()) {
      console.error(`Authentication strategy '${provider}' is not available`);
      return false;
    }

    this.currentStrategy = strategy;
    return true;
  }

  public async authenticate(credentials?: AuthCredentials): Promise<AuthResult> {
    if (!this.currentStrategy) {
      return {
        success: false,
        error: "No authentication strategy selected",
      };
    }

    return await this.currentStrategy.authenticate(credentials);
  }

  public getAvailableProviders(): AuthProvider[] {
    const availableProviders: AuthProvider[] = [];
    
    this.strategies.forEach((strategy, provider) => {
      if (strategy.isAvailable()) {
        availableProviders.push(provider);
      }
    });

    return availableProviders;
  }

  public getCurrentProvider(): string | null {
    return this.currentStrategy?.getProviderName() || null;
  }

  public isProviderAvailable(provider: AuthProvider): boolean {
    const strategy = this.strategies.get(provider);
    return strategy ? strategy.isAvailable() : false;
  }
} 