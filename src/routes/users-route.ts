import { Elysia, t } from "elysia";
import { usersService } from "../services/users-service";

const errorResponse = t.Object({
  error: t.String(),
});

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
      detail: {
        tags: ["Users"],
        summary: "Daftar User Baru",
        description:
          "Mendaftarkan user baru dengan mengirimkan name, email, dan password",
      },
      response: {
        200: t.Object({
          data: t.String(),
        }),
        400: errorResponse,
      },
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
      detail: {
        tags: ["Users"],
        summary: "Login User",
        description: "Mengotentikasi user dan mengembalikan Bearer Token",
      },
      response: {
        200: t.Object({
          data: t.String(),
        }),
        401: errorResponse,
      },
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
  }, {
    detail: {
      tags: ["Users"],
      summary: "Get Current User",
      description: "Mengambil data user yang sedang login berdasarkan Bearer Token",
      security: [{ bearerAuth: [] }]
    },
    response: {
      200: t.Object({
        data: t.Object({
          id: t.Number(),
          name: t.String(),
          email: t.String(),
          created_at: t.Nullable(t.Date()),
        }),
      }),
      401: errorResponse,
    }
  })
  .delete("/logout", async ({ token, set }) => {
    if (!token) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    return await usersService.logoutUser(token);
  }, {
    detail: {
      tags: ["Users"],
      summary: "Logout User",
      description: "Menghapus sesi token user",
      security: [{ bearerAuth: [] }]
    },
    response: {
      200: t.Object({
        data: t.String(),
      }),
      401: errorResponse,
    }
  });
