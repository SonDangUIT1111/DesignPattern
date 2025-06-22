import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      avatar: string;
      phone: string;
      coinPoint: number;
      questLog: any;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
    avatar: string;
    phone: string;
    coinPoint: number;
    questLog: any;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    avatar: string;
    phone: string;
    coinPoint: number;
    questLog: any;
  }
} 