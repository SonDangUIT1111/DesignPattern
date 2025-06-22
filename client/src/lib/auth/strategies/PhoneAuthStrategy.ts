import { signIn } from "next-auth/react";
import { AuthStrategy, AuthResult, AuthCredentials } from "./AuthStrategy";

export interface PhoneCredentials extends AuthCredentials {
  phone: string;
  password: string;
}

export class PhoneAuthStrategy implements AuthStrategy {
  getProviderName(): string {
    return "phone";
  }

  isAvailable(): boolean {
    return true; // Phone auth is always available
  }

  async authenticate(credentials: PhoneCredentials): Promise<AuthResult> {
    try {
      const formattedPhone = this.formatPhoneNumber(credentials.phone);
      
      const res = await signIn("credentials", {
        phone: formattedPhone,
        password: credentials.password,
        redirect: false,
      });

      if (res?.error) {
        return {
          success: false,
          error: res.error,
        };
      }

      return {
        success: true,
        user: res,
      };
    } catch (error) {
      console.error("Phone authentication error:", error);
      return {
        success: false,
        error: "Đã xảy ra lỗi trong quá trình đăng nhập",
      };
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove non-numeric characters
    const cleaned = phone.replace(/\D/g, "");

    // Check if the phone number starts with 0 and replace it with +84
    if (cleaned.startsWith("0")) {
      return `+84${cleaned.substring(1)}`;
    }
    return phone; // Return as is if it doesn't start with 0
  }
} 