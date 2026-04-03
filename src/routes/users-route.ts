import { Elysia, t } from "elysia";
import { usersService } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION" || code === "PARSE") return;

    const errorMsg = (error as any).message || String(error);

    if (errorMsg === "Unauthorized" || errorMsg === "Email atau password salah") {
      set.status = 401;
      return { error: errorMsg };
    }

    if (errorMsg === "Email sudah terdaftar") {
      set.status = 400;
      return { error: errorMsg };
    }

    set.status = 500;
    return { error: "Terjadi kesalahan pada server" };
  })
  .post(
    "/",
    async ({ body }) => {
      const { name, email, password } = body;
      return await usersService.registerUser(name, email, password);
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255 }),
        email: t.String({ format: "email", maxLength: 255 }),
        password: t.String({ minLength: 6, maxLength: 255 }),
      }),
    }
  )
  .post(
    "/login",
    async ({ body }) => {
      const { email, password } = body;
      return await usersService.loginUser(email, password);
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .derive(({ headers }) => {
    const authorization = headers["authorization"];
    const token = authorization?.startsWith("Bearer ")
      ? authorization.substring(7)
      : null;
    return { token };
  })
  .get("/current", async ({ token, set }) => {
    if (!token) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    return await usersService.getCurrentUser(token);
  })
  .delete("/logout", async ({ token, set }) => {
    if (!token) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    return await usersService.logoutUser(token);
  });
