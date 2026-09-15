import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@medtrack.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          largeTextPref: user.largeTextPref,
          darkModePref: user.darkModePref,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.largeTextPref = (user as any).largeTextPref;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.darkModePref = (user as any).darkModePref;
      }
      if (trigger === "update" && session) {
        if (session.largeTextPref !== undefined) token.largeTextPref = session.largeTextPref;
        if (session.darkModePref !== undefined) token.darkModePref = session.darkModePref;
        if (session.name) token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).largeTextPref = token.largeTextPref as boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).darkModePref = token.darkModePref as boolean;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "medtrack-secret-key-clinical-fallback-2026",
};
