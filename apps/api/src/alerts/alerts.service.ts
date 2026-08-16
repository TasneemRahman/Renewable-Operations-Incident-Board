import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { db } from '../db/db';

import { alerts, alertEvents, operationalEvents, followUpNotes } from '../db/schema';
import { Alert, AlertDetail, AlertStatus, FollowUpNote, LinkedOperationalEvent, AlertSeverity } from '../db/types';
import { eq, desc, and } from 'drizzle-orm';
import { AiService } from '../ai/ai.service';

@Injectable()
export class AlertsService {
  constructor(private readonly aiService: AiService) {}

  /**
   * List all alerts with optional filtering by site, severity, and status.
   */
  async getAlerts(filters?: {
    site?: string;
    severity?: AlertSeverity;
    status?: AlertStatus;
  }): Promise<Alert[]> {
    const conditions = [];

    if (filters?.site) {
      conditions.push(eq(alerts.site, filters.site));
    }
    if (filters?.severity) {
      conditions.push(eq(alerts.severity, filters.severity));
    }
    if (filters?.status) {
      conditions.push(eq(alerts.status, filters.status));
    }

    const query = db.select().from(alerts);
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return query.where(whereClause).orderBy(desc(alerts.timestamp));
  }

  /**
   * Get single alert with linked operational events (timeline) and follow-up notes.
   */
  async getAlertDetail(alertId: string): Promise<AlertDetail> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, alertId));

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${alertId} not found`);
    }

    // Get linked events with role
    const linkedEventRows = await db
      .select({
        id: operationalEvents.id,
        site: operationalEvents.site,
        timestamp: operationalEvents.timestamp,
        source: operationalEvents.source,
        type: operationalEvents.type,
        message: operationalEvents.message,
        payload: operationalEvents.payload,
        role: alertEvents.role,
      })
      .from(alertEvents)
      .innerJoin(operationalEvents, eq(alertEvents.eventId, operationalEvents.id))
      .where(eq(alertEvents.alertId, alertId))
      .orderBy(operationalEvents.timestamp);

    const events: LinkedOperationalEvent[] = linkedEventRows.map((r) => ({
      id: r.id,
      site: r.site,
      timestamp: r.timestamp,
      source: r.source,
      type: r.type,
      message: r.message,
      payload: r.payload,
      role: r.role as 'trigger' | 'context',
    }));

    // Get follow up notes
    const notes: FollowUpNote[] = await db
      .select()
      .from(followUpNotes)
      .where(eq(followUpNotes.alertId, alertId))
      .orderBy(desc(followUpNotes.createdAt));

    return {
      ...alert,
      events,
      notes,
    };
  }

  /**
   * Update alert workflow status (open, investigating, resolved)
   */
  async updateStatus(alertId: string, status: AlertStatus): Promise<Alert> {
    const [updated] = await db
      .update(alerts)
      .set({ status })
      .where(eq(alerts.id, alertId))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Alert with ID ${alertId} not found`);
    }

    return updated;
  }

  /**
   * Add a follow-up note to an alert
   */
  async addNote(alertId: string, text: string): Promise<FollowUpNote> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, alertId));
    if (!alert) {
      throw new NotFoundException(`Alert with ID ${alertId} not found`);
    }

    const noteId = randomUUID();
    const [newNote] = await db
      .insert(followUpNotes)
      .values({
        id: noteId,
        alertId,
        text,
        createdAt: new Date(),
      })
      .returning();

    return newNote;
  }


  /**
   * Generate AI explanation for an alert
   */
  async explainAlert(alertId: string) {
    const alertDetail = await this.getAlertDetail(alertId);
    return this.aiService.explainIncident(alertDetail);
  }
}
