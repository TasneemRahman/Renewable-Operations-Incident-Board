import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as schema from './schema';

// OperationalEvent Types
export type OperationalEvent = InferSelectModel<typeof schema.operationalEvents>;
export type NewOperationalEvent = InferInsertModel<typeof schema.operationalEvents>;

export type OperationalEventPayload = {
  value?: number | string | boolean;
  unit?: string;
  previousValue?: number | string | boolean;
  threshold?: number;
  [key: string]: any;
};

// Alert Types
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'open' | 'investigating' | 'resolved';

export type Alert = InferSelectModel<typeof schema.alerts>;
export type NewAlert = InferInsertModel<typeof schema.alerts>;

// AlertEvent Types
export type AlertEventRole = 'trigger' | 'context';
export type AlertEvent = InferSelectModel<typeof schema.alertEvents>;
export type NewAlertEvent = InferInsertModel<typeof schema.alertEvents>;

// FollowUpNote Types
export type FollowUpNote = InferSelectModel<typeof schema.followUpNotes>;
export type NewFollowUpNote = InferInsertModel<typeof schema.followUpNotes>;

// Aggregate / Query Response Types
export type LinkedOperationalEvent = OperationalEvent & {
  role: AlertEventRole;
};

export type AlertDetail = Alert & {
  events: LinkedOperationalEvent[];
  notes: FollowUpNote[];
};


// AI Incident Explanation Types (Section 9.2)
export type IncidentExplanation = {
  summary: string;
  likelyTrigger?: string;
  evidence: Array<{
    eventId: string;
    statement: string;
  }>;
  suggestedChecks: string[];
  confidence: 'low' | 'medium' | 'high';
  caveat?: string;
};