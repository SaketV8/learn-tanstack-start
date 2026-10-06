import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
export const todos = pgTable('todos', {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text().notNull(),
  isComplete: boolean().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow().notNull().$onUpdate(() => new Date()),
})
