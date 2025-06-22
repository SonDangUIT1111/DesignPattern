import { signIn } from "next-auth/react";
import { AuthStrategy, AuthResult, AuthCredentials } from "./AuthStrategy";

export interface GoogleCredentials extends AuthCredentials {
}

export class GoogleAuthStrategy implements AuthStrategy {
  getProviderName(): string {
    return "google";
  }

  isAvailable(): boolean {
    return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !== undefined;
  }

  async authenticate(credentials?: GoogleCredentials): Promise<AuthResult> {
    try {
      const res = await signIn("google", {
        redirect: false,
        callbackUrl: "/",
      });

      if (res?.error) {
        return {
          success: false,
          error: res.error,
        };
      }

      if (res?.url) {
        return {
          success: true,
          redirectUrl: res.url,
        };
      }

      return {
        success: true,
        user: res,
      };
    } catch (error) {
      console.error("Google authentication error:", error);
      return {
        success: false,
        error: "Đã xảy ra lỗi khi đăng nhập bằng Google",
      };
    }
  }
} 