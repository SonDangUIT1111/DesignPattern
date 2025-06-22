import React from "react";
import LoginWithStrategy from "@/components/auth/LoginWithStrategy";
import { alreadyLoggedIn } from "@/lib/auth";

const page = async () => {
  await alreadyLoggedIn();
  return (
    <div className="flex justify-center items-center bg-transparent w-full h-screen relative">
      <LoginWithStrategy />
      <div
        className="absolute top-0 left-0 h-full w-full -z-0 bg-[length:460px_360px] brightness-[0.2]"
        style={{
          backgroundImage: "url('/comiclist.jpg')",
          backgroundRepeat: "repeat",
        }}
      ></div>
    </div>
  );
};

export default page;
