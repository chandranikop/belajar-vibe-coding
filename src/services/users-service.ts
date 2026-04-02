import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

export class UsersService {
  async registerUser(name: string, email: string, password: string) {
    // 1. Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error("Email sudah terdaftar");
    }

    // 2. Hash password (using Bun's built-in bcrypt)
    const passwordHash = await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    // 3. Insert new user (map name to username)
    await db.insert(users).values({
      username: name,
      email,
      password: passwordHash,
    });

    return { data: "OK" };
  }

  async loginUser(email: string, password: string) {
    // 1. Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length === 0) {
      throw new Error("Email atau password salah");
    }

    const user = existingUser[0];

    if (!user) {
      throw new Error("Email atau password salah");
    }

    // 2. Verify password
    const isPasswordValid = await Bun.password.verify(password, user.password);

    if (!isPasswordValid) {
      throw new Error("Email atau password salah");
    }

    // 3. Generate UUID token and save to sessions table
    const token = crypto.randomUUID();

    await db.insert(sessions).values({
      token,
      userId: user.id,
    });

    return { data: token };
  }

  async getCurrentUser(token: string) {
    // 1. Find session by token and join with users table
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token))
      .limit(1);

    const user = result[0];

    if (!user) {
      throw new Error("Unauthorized");
    }

    // 2. Return user details (without sensitive fields)
    return {
      data: {
        id: user.id,
        name: user.username,
        email: user.email,
        created_at: user.createdAt,
      },
    };
  }

  async logoutUser(token: string) {
    // 1. Check if session exists by token
    const existingSession = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);

    const session = existingSession[0];

    if (!session) {
      throw new Error("Unauthorized");
    }

    // 2. Delete session from database
    await db.delete(sessions).where(eq(sessions.token, token));

    return { data: "OK" };
  }
}

export const usersService = new UsersService();
