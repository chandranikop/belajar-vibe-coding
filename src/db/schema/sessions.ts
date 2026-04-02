import { mysqlTable, serial, varchar, timestamp, bigint } from "drizzle-orm/mysql-core";
import { users } from "./users";

export const sessions = mysqlTable("sessions", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 255 }).notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});
