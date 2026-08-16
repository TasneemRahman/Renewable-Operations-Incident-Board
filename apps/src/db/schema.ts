import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const operationalEvents = sqliteTable('operational_events', {
  id: text('id').primaryKey(),
  site: text('site').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp_ms' }).notNull(),
  source: text('source').notNull(), // e.g. inverter-03, cooling-fan-03, BESS-02
  type: text('type').notNull(), // e.g. temperature_reading, fan_speed, output_change
  message: text('message').notNull(),
  payload: text('payload', { mode: 'json' }).$type<Record<string, any>>().notNull(),
});

export const alerts = sqliteTable('alerts', {
  id: text('id').primaryKey(),
  site: text('site').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp_ms' }).notNull(),
  type: text('type').notNull(), // e.g. inverter_high_temperature, battery_overheat
  severity: text('severity', { enum: ['critical', 'high', 'medium', 'low'] }).notNull(),
  description: text('description').notNull(),
  status: text('status', { enum: ['open', 'investigating', 'resolved'] }).notNull().default('open'),
});


export const alertEvents = sqliteTable(
  'alert_events',
  {
    alertId: text('alert_id')
      .notNull()
      .references(() => alerts.id, { onDelete: 'cascade' }),
    eventId: text('event_id')
      .notNull()
      .references(() => operationalEvents.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['trigger', 'context'] }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.alertId, table.eventId] }),
  ],
);


export const followUpNotes = sqliteTable('follow_up_notes', {
  id: text('id').primaryKey(),
  alertId: text('alert_id')
    .notNull()
    .references(() => alerts.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

// Relations for relational queries
export const operationalEventsRelations = relations(operationalEvents, ({ many }) => ({
  alertEvents: many(alertEvents),
}));

export const alertsRelations = relations(alerts, ({ many }) => ({
  alertEvents: many(alertEvents),
  notes: many(followUpNotes),
}));


export const alertEventsRelations = relations(alertEvents, ({ one }) => ({
  alert: one(alerts, {
    fields: [alertEvents.alertId],
    references: [alerts.id],
  }),
  event: one(operationalEvents, {
    fields: [alertEvents.eventId],
    references: [operationalEvents.id],
  }),
}));

export const followUpNotesRelations = relations(followUpNotes, ({ one }) => ({
  alert: one(alerts, {
    fields: [followUpNotes.alertId],
    references: [alerts.id],
  }),
}));
