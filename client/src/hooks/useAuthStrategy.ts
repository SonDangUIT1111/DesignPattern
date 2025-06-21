import { useState, useCallback, useMemo } from "react";
import { AuthContext, AuthProvider } from "@/lib/auth/AuthContext";
import { AuthResult, AuthCredentials } from "@/lib/auth/strategies/AuthStrategy";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export const useAuthStrategy = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<AuthProvider | null>(null);
  
  const authContext = useMemo(() => new AuthContext(), []);
  const availableProviders = useMemo(() => authContext.getAvailableProviders(), [authContext]);

  const selectProvider = useCallback((provider: AuthProvider): boolean => {
    const success = authContext.setStrategy(provider);
    if (success) {
      setCurrentProvider(provider);
    }
    return success;
  }, [authContext]);

  const authenticate = useCallback(async (
    provider: AuthProvider,
    credentials?: AuthCredentials
  ): Promise<AuthResult> => {
    setIsLoading(true);
    
    try {
      if (!selectProvider(provider)) {
        return {
          success: false,
          error: `Provider ${provider} is not available`,
        };
      }
      const result = await authContext.authenticate(credentials);
      if (result.success) {
        toast.success("Đăng nhập thành công");
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
        } else {
          router.push("/");
          router.refresh();
        }
      } else {
        toast.error(result.error || "Đăng nhập thất bại");
      }
      
      return result;
    } catch (error) {
      console.error("Authentication error:", error);
      const errorResult = {
        success: false,
        error: "Đã xảy ra lỗi không mong muốn",
      };
      toast.error(errorResult.error);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, [authContext, selectProvider, router]);

  const isProviderAvailable = useCallback((provider: AuthProvider): boolean => {
    return authContext.isProviderAvailable(provider);
  }, [authContext]);

  return {
    isLoading,
    currentProvider,
    availableProviders,
    authenticate,
    selectProvider,
    isProviderAvailable,
  };
}; 