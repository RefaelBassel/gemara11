import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db, ensureSchema } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.sub) return false;
      await ensureSchema();
      const c = db();
      const today = new Date().toISOString().slice(0, 10);
      const existing = await c.execute({
        sql: "SELECT id FROM users WHERE google_id = ?",
        args: [profile.sub],
      });
      if (existing.rows.length === 0) {
        const id = `u_${profile.sub}`;
        await c.execute({
          sql: `INSERT INTO users (id, google_id, name, email, role, last_login)
                VALUES (?, ?, ?, ?, 'student', ?)`,
          args: [
            id,
            profile.sub,
            profile.name ?? "תלמיד",
            (profile as { email?: string }).email ?? null,
            new Date().toISOString(),
          ],
        });
      } else {
        await c.execute({
          sql: "UPDATE users SET last_login = ? WHERE google_id = ?",
          args: [new Date().toISOString(), profile.sub],
        });
      }
      const userRow = await c.execute({
        sql: "SELECT id FROM users WHERE google_id = ?",
        args: [profile.sub],
      });
      const uid = userRow.rows[0]?.id as string | undefined;
      if (uid) {
        const inserted = await c.execute({
          sql: "INSERT OR IGNORE INTO daily_logins (user_id, login_date) VALUES (?, ?)",
          args: [uid, today],
        });
        if (inserted.rowsAffected > 0) {
          await c.execute({
            sql: "UPDATE users SET xp = xp + 10 WHERE id = ?",
            args: [uid],
          });
          await c.execute({
            sql: "INSERT INTO xp_log (user_id, amount, reason) VALUES (?, 10, 'daily_login')",
            args: [uid],
          });
        }
      }
      return true;
    },
    async jwt({ token, profile }) {
      if (profile?.sub) {
        token.googleId = profile.sub;
      }
      if (token.googleId && !token.uid) {
        await ensureSchema();
        const r = await db().execute({
          sql: "SELECT id, name, role FROM users WHERE google_id = ?",
          args: [token.googleId as string],
        });
        const row = r.rows[0];
        if (row) {
          token.uid = row.id as string;
          token.uname = row.name as string;
          token.role = row.role as string;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) {
        (session.user as { id?: string }).id = token.uid as string;
        (session.user as { role?: string }).role = (token.role as string) ?? "student";
        if (token.uname) session.user!.name = token.uname as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
