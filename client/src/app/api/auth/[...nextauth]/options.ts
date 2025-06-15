import { AuthOptions } from "next-auth";
import CredentialsProvider from 'next-auth/providers/credentials';
import FacebookProvider from 'next-auth/providers/facebook';
import GoogleProvider from 'next-auth/providers/google';
import prisma from "@/lib/prisma";
import jwt from 'jsonwebtoken';
import { hashPassword } from "@/lib/auth";


const options: AuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { phone, password } = credentials as {
          phone: string;
          password: string;
        };

        // Find the user by phone
        const user = await prisma.users.findFirst({
          where: { phone },
        });

        if (!user) throw new Error("Phone or password is incorrect");

        if (!user.authentication) throw new Error("User authentication data is missing");

        const { password: storedPassword, salt } = user.authentication;

        // Hash the provided password using the shared utility
        const hashedInputPassword = hashPassword(salt, password);

        console.log(hashedInputPassword, storedPassword);

        // Compare the hashes
        if (hashedInputPassword !== storedPassword) {
          throw new Error("Phone or password is incorrect");
        }

        // Return user data to attach to the session
        return {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          phone: user.phone,
          coinPoint: user.coinPoint,
          questLog: user.questLog,
        };
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn(params) {
      console.log('paramssssssssssssssssssssssssssssssssssssssssssssss: ');
      console.log(params);
      if (!params?.user?.id || parseInt(params?.user?.id) === -1) {
        const payload = jwt.sign(
          { email: params?.user?.email, name: params?.user?.name },
          process.env.NEXT_PUBLIC_JWT_SECRET || 'fallback-secret',
          { expiresIn: '1h' }
        );
        return `/auth/register/?payload=${payload}`;
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      console.log('user in jwt: ');
      console.log(token);
      console.log(user);
      if (trigger === 'update' && session?.avatar) {
        token.avatar = session.avatar;
        return { ...token, ...session.user };
      }
      if (user) {
        token.id = user.id;
        token.coinPoint = user.coinPoint;
        token.avatar = user.avatar;
        token.username = user.username;
        token.phone = user.phone;
        token.questLog = user.questLog;
      }

      return token;
    },
    async session({ token, session }) {

      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { username: string }).username = token.username as string;
        (session.user as { avatar: string }).avatar = token.avatar as string;
        (session.user as { phone: string }).phone = token.phone as string;
        (session.user as { coinPoint: number }).coinPoint = token.coinPoint as number;
        (session.user as { questLog: any[] }).questLog = token.questLog as any[];
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
};

export default options;
