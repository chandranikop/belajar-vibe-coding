import { db } from "../db";
import { users } from "../db/schema";
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

    // 3. Return user (excluding password)
    const { password: _, ...userWithoutPassword } = user;

    return { data: userWithoutPassword };
  }
}

export const usersService = new UsersService();
