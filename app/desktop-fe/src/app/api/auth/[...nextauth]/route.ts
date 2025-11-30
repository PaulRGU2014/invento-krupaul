import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { promises as fs } from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const dataPath = path.join(process.cwd(), "data", "users.json");
        let users: Array<{ id: string; email: string; passwordHash: string; name?: string }> = [];
        try {
          const raw = await fs.readFile(dataPath, "utf8");
          users = JSON.parse(raw || "[]");
        } catch (err) {
          users = [];
        }
        const user = users.find((u) => u.email.toLowerCase() === String(credentials.email).toLowerCase());
        if (!user) return null;
        const ok = await bcrypt.compare(String(credentials.password), user.passwordHash);
        if (!ok) return null;
        return { id: user.id, name: user.name || user.email.split("@")[0], email: user.email } as any;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
