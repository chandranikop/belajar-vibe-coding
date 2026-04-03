import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/index";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { sql, eq } from "drizzle-orm";

describe("Users API", () => {
  beforeEach(async () => {
    // Delete all data before each test for consistency
    await db.delete(sessions);
    await db.delete(users);
  });

  describe("POST /api/users (Registration)", () => {
    it("should successfully register a new user", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Niko",
            email: "niko@example.com",
            password: "password123",
          }),
        })
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.data).toBe("OK");
    });

    it("should fail to register with an existing email", async () => {
      await db.insert(users).values({
        username: "Existing",
        email: "niko@example.com",
        password: "hashedpassword",
      });

      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Niko",
            email: "niko@example.com",
            password: "password123",
          }),
        })
      );

      const body = await response.json();
      expect(response.status).toBe(400);
      expect(body.error).toBe("Email sudah terdaftar");
    });

    it("should fail if name is empty", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "",
            email: "niko@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(422); // Validation error
    });

    it("should fail if name is longer than 255 characters", async () => {
      const longName = "a".repeat(256);
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: longName,
            email: "niko@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(422); // Validation error
    });

    it("should fail if email format is invalid", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Niko",
            email: "invalid-email",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(422); // Validation error
    });

    it("should fail if password is too short", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Niko",
            email: "niko@example.com",
            password: "123",
          }),
        })
      );

      expect(response.status).toBe(422); // Validation error
    });
  });

  describe("POST /api/users/login (Login)", () => {
    beforeEach(async () => {
      const passwordHash = await Bun.password.hash("password123", {
        algorithm: "bcrypt",
        cost: 10,
      });
      await db.insert(users).values({
        username: "Niko",
        email: "niko@example.com",
        password: passwordHash,
      });
    });

    it("should successfully login with valid credentials", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "niko@example.com",
            password: "password123",
          }),
        })
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.data).toBeDefined();
      expect(typeof body.data).toBe("string");
    });

    it("should fail to login with wrong password", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "niko@example.com",
            password: "wrongpassword",
          }),
        })
      );

      const body = await response.json();
      expect(response.status).toBe(401);
      expect(body.error).toBe("Email atau password salah");
    });

    it("should fail to login with unregistered email", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "unknown@example.com",
            password: "password123",
          }),
        })
      );

      const body = await response.json();
      expect(response.status).toBe(401);
      expect(body.error).toBe("Email atau password salah");
    });
  });

  describe("GET /api/users/current (Profile)", () => {
    let currentToken: string;

    beforeEach(async () => {
      const passwordHash = await Bun.password.hash("password123", {
        algorithm: "bcrypt",
        cost: 10,
      });
      const [userResult] = await db.insert(users).values({
        username: "Niko",
        email: "niko@example.com",
        password: passwordHash,
      });
      
      // Get the last insert ID since Drizzle MySQL doesn't return ID directly on manual insert
      const [lastIdResult] = await db.execute(sql`SELECT LAST_INSERT_ID() as id`);
      const userId = (lastIdResult as any)[0].id;

      currentToken = crypto.randomUUID();
      await db.insert(sessions).values({
        token: currentToken,
        userId: userId,
      });
    });

    it("should successfully get current user profile", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        })
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.data.name).toBe("Niko");
      expect(body.data.email).toBe("niko@example.com");
      expect(body.data.password).toBeUndefined();
    });

    it("should fail without authorization header", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
        })
      );

      const body = await response.json();
      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });

    it("should fail with invalid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: "Bearer invalidtoken",
          },
        })
      );

      const body = await response.json();
      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("DELETE /api/users/logout (Logout)", () => {
    let currentToken: string;

    beforeEach(async () => {
      const [userResult] = await db.insert(users).values({
        username: "LogoutUser",
        email: "logout@example.com",
        password: "hashedpassword",
      });

      const [lastIdResult] = await db.execute(sql`SELECT LAST_INSERT_ID() as id`);
      const userId = (lastIdResult as any)[0].id;

      currentToken = crypto.randomUUID();
      await db.insert(sessions).values({
        token: currentToken,
        userId: userId,
      });
    });

    it("should successfully logout user and delete session", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        })
      );

      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.data).toBe("OK");

      // Verify session is deleted from DB
      const sessionResult = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, currentToken))
        .limit(1);
      
      expect(sessionResult.length).toBe(0);
    });

    it("should fail logout with non-existent token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: "Bearer unknown-token",
          },
        })
      );

      const body = await response.json();
      expect(response.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });
  });
});
