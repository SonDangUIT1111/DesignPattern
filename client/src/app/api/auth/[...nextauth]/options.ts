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
      console.log('SignIn params:', params);
      
      // Handle OAuth providers (Google, Facebook)
      if (params.account?.provider === "google" || params.account?.provider === "facebook") {
        const { email, name, image } = params.user;
        
        if (!email) {
          console.error("Email is required for OAuth users");
          return false;
        }
        
        try {
          // Check if user already exists by email (stored in phone field for OAuth users)
          let existingUser = await prisma.users.findFirst({
            where: { 
              phone: email // Using phone field to store email for OAuth users
            },
          });

          if (!existingUser) {
            // Create new user for OAuth
            const newUser = await prisma.users.create({
              data: {
                username: name || email,
                phone: email, // Store email in phone field for OAuth users
                avatar: image || "https://i.pinimg.com/736x/dc/9c/61/dc9c614e3007080a5aff36aebb949474.jpg",
                coinPoint: 0,
                accessCommentDate: new Date(),
                bookmarkList: {
                  comic: [],
                  movies: []
                },
                histories: {
                  readingComic: [],
                  watchingMovie: []
                },
                paymentHistories: [],
                challenges: [],
                questLog: {
                  readingTime: 0,
                  watchingTime: 0,
                  received: [],
                  finalTime: new Date(),
                  hasReceivedDailyGift: false,
                },
                notifications: []
              },
            });
            
            // Set user id for the session
            params.user.id = newUser.id;
          } else {
            // Set existing user id for the session
            params.user.id = existingUser.id;
          }
          
          return true;
        } catch (error) {
          console.error("Error handling OAuth user:", error);
          return false;
        }
      }
      
      // Handle credentials provider
      if (params.account?.provider === "credentials") {
        return true;
      }
      
      // For other cases, redirect to register if no user ID
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

    async jwt({ token, user, trigger, session, account }) {
      console.log('JWT callback - user:', user);
      console.log('JWT callback - token:', token);
      console.log('JWT callback - account:', account);
      
      if (trigger === 'update' && session?.avatar) {
        token.avatar = session.avatar;
        return { ...token, ...session.user };
      }
      
      if (user) {
        // For OAuth users, fetch full user data from database
        if (account?.provider === "google" || account?.provider === "facebook") {
          try {
            const dbUser = await prisma.users.findUnique({
              where: { id: user.id },
            });
            
            if (dbUser) {
              token.id = dbUser.id;
              token.coinPoint = dbUser.coinPoint;
              token.avatar = dbUser.avatar;
              token.username = dbUser.username;
              token.phone = dbUser.phone;
              token.questLog = dbUser.questLog;
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        } else {
          // For credentials provider
          token.id = user.id;
          token.coinPoint = user.coinPoint;
          token.avatar = user.avatar;
          token.username = user.username;
          token.phone = user.phone;
          token.questLog = user.questLog;
        }
      } else if (token.sub && !token.id) {
        // For subsequent calls when user is undefined, fetch from database using token.sub
        try {
          const dbUser = await prisma.users.findUnique({
            where: { id: token.sub },
          });
          
          if (dbUser) {
            token.id = dbUser.id;
            token.coinPoint = dbUser.coinPoint;
            token.avatar = dbUser.avatar;
            token.username = dbUser.username;
            token.phone = dbUser.phone;
            token.questLog = dbUser.questLog;
          }
        } catch (error) {
          console.error("Error fetching user data by token.sub:", error);
        }
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
