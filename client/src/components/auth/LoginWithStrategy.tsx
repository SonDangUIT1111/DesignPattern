"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@nextui-org/react";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { FaFacebook, FaGoogle } from "react-icons/fa";
import { useAuthStrategy } from "@/hooks/useAuthStrategy";
import { PhoneCredentials } from "@/lib/auth/strategies/PhoneAuthStrategy";
import Loader from "@/components/Loader";

const LoginWithStrategy = ({ className }: { className?: string }) => {
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  });
  const [show, setShow] = useState({
    showPass: false,
  });
  const [errors, setErrors] = useState({
    phone: "",
    password: "",
  });

  const {
    isLoading,
    authenticate,
    isProviderAvailable,
  } = useAuthStrategy();

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {
      phone: "",
      password: "",
    };

    if (!formData.phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    }

    setErrors(newErrors);
    return !newErrors.phone && !newErrors.password;
  };

  // Handle phone/password login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const credentials: PhoneCredentials = {
      phone: formData.phone,
      password: formData.password,
    };

    await authenticate("phone", credentials);
  };

  // Handle Facebook login
  const handleFacebookLogin = async () => {
    await authenticate("facebook");
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    await authenticate("google");
  };

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-4 text-white z-10 bg-transparent border-none">
      <CardHeader className="flex flex-col justify-center items-center gap-1">
        <img src="/logoImage.png" width={60} height={60} alt="Logo" />
        <CardTitle className="text-2xl text-center">Sign-in</CardTitle>
        <p className="text-zinc-400 text-center text-sm">
          Đăng nhập để tiếp tục trải nghiệm nào
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Phone/Password Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Nhập số điện thoại"
                className="w-full bg-transparent border-b-slate-400 border-b-[1px] border-t-0 border-r-0 border-l-0 rounded-none text-white placeholder:text-zinc-400 py-2 px-0 focus:outline-none focus:border-purple-500"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>
            <div>
              <div className="relative">
                <input
                  type={show.showPass ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Nhập mật khẩu"
                  className="w-full bg-transparent border-b-slate-400 border-b-[1px] border-t-0 border-r-0 border-l-0 rounded-none text-white placeholder:text-zinc-400 py-2 px-0 pr-10 focus:outline-none focus:border-purple-500"
                />
                <div
                  onClick={() => {
                    setShow({
                      ...show,
                      showPass: !show.showPass,
                    });
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-50 cursor-pointer hover:opacity-100"
                >
                  {show.showPass ? (
                    <AiFillEyeInvisible size={20} />
                  ) : (
                    <AiFillEye size={20} />
                  )}
                </div>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>
          </div>
          <div className="flex justify-center w-full my-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-[60%] rounded-full h-[50px] text-white text-base font-medium mt-2 transition-colors transition-transform transition-shadow transition-all duration-500 bg-left hover:bg-right hover:shadow-[#A958FE] hover:shadow-lg data-[hover=true]:opacity-100"
              style={{
                backgroundSize: "200% auto",
                backgroundImage:
                  "var(--button_primary_background_color, linear-gradient(90deg, #A958FE, #DA5EF0 50%, #A958FE))",
              }}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </div>
        </form>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="flex-1 border-t border-zinc-600"></div>
            <span className="px-4 text-zinc-400 text-sm">Hoặc đăng nhập bằng</span>
            <div className="flex-1 border-t border-zinc-600"></div>
          </div>

          <div className="flex gap-3">
            {/* Facebook Login */}
            {isProviderAvailable("facebook") && (
              <Button
                onClick={handleFacebookLogin}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full h-[50px] flex items-center justify-center gap-2"
              >
                <FaFacebook size={20} />
                Facebook
              </Button>
            )}

            {/* Google Login */}
            {isProviderAvailable("google") && (
              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-full h-[50px] flex items-center justify-center gap-2"
              >
                <FaGoogle size={20} />
                Google
              </Button>
            )}
          </div>
        </div>

        <div className="text-center">
          <Link
            href="#"
            className="text-purple-500 hover:text-purple-400 text-sm"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <div className="text-center space-y-2 text-sm">
          <p className="text-zinc-400">
            Bằng cách chọn "Đăng nhập tài khoản", bạn đồng ý với các{" "}
            <Link
              href="#"
              className="text-purple-500 hover:text-purple-400"
            >
              Điều khoản sử dụng
            </Link>{" "}
            và{" "}
            <Link
              href="#"
              className="text-purple-500 hover:text-purple-400"
            >
              Chính sách riêng tư
            </Link>{" "}
            của Skylark.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginWithStrategy; 