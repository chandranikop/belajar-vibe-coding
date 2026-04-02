import { Elysia } from "elysia";
import { usersRoute } from "./routes/users-route";

const app = new Elysia()
  .use(usersRoute)
  .get("/", () => "Welcome to Bun + ElysiaJS + Drizzle + MySQL")
  .get("/health", () => ({ status: "ok" }))
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
