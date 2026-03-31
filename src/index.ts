import { Elysia } from "elysia";

const app = new Elysia()
  .get("/", () => "Welcome to Bun + ElysiaJS + Drizzle + MySQL")
  .get("/health", () => ({ status: "ok" }))
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
