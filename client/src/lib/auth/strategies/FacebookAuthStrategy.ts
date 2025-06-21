import { signIn } from "next-auth/react";
import { AuthStrategy, AuthResult, AuthCredentials } from "./AuthStrategy";

export interface FacebookCredentials extends AuthCredentials {
  // Facebook doesn't need explicit credentials from user, handled by OAuth
}

export class FacebookAuthStrategy implements AuthStrategy {
  getProviderName(): string {
    return "facebook";
  }

  isAvailable(): boolean {
    // Remove window check to avoid hydration issues
    return process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID !== undefined;
  }

  async authenticate(credentials?: FacebookCredentials): Promise<AuthResult> {
    try {
      const res = await signIn("facebook", {
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
      console.error("Facebook authentication error:", error);
      return {
        success: false,
        error: "Đã xảy ra lỗi khi đăng nhập bằng Facebook",
      };
    }
  }
} 