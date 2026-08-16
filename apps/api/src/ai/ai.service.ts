import { Injectable } from '@nestjs/common';
import { AlertDetail, IncidentExplanation } from '../db/types';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const incidentExplanationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: 'Clear, 2-3 sentence overview of what happened leading up to the alert.',
    },
    likelyTrigger: {
      type: Type.STRING,
      description: 'The specific event or root cause condition that directly fired the alert.',
    },
    evidence: {
      type: Type.ARRAY,
      description: 'Key events from the timeline cited as factual evidence.',
      items: {
        type: Type.OBJECT,
        properties: {
          eventId: { type: Type.STRING, description: 'The exact event id cited' },
          statement: { type: Type.STRING, description: 'What this event proves in the sequence' },
        },
        required: ['eventId', 'statement'],
      },
    },
    suggestedChecks: {
      type: Type.ARRAY,
      description: 'Actionable diagnostic steps for the site technician or operations engineer.',
      items: { type: Type.STRING },
    },
    confidence: {
      type: Type.STRING,
      enum: ['low', 'medium', 'high'],
      description: 'Confidence in this explanation based on available evidence.',
    },
    caveat: {
      type: Type.STRING,
      description: 'Safety disclaimer stating this is advisory AI assistance.',
    },
  },
  required: ['summary', 'likelyTrigger', 'evidence', 'suggestedChecks', 'confidence', 'caveat'],
};

@Injectable()
export class AiService {
  private aiClient?: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.aiClient = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Explains an alert and its linked events using Gemini structured output.
   */
  async explainIncident(alertDetail: AlertDetail): Promise<IncidentExplanation> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    try {
      if (!this.aiClient) {
        this.aiClient = new GoogleGenAI({ apiKey });
      }

      const prompt = `
You are an expert renewable energy operations engineer analyzing an incident at a solar/battery facility.

Alert Information:
- Site: ${alertDetail.site}
- Alert Type: ${alertDetail.type}
- Severity: ${alertDetail.severity}
- Description: ${alertDetail.description}
- Timestamp: ${new Date(alertDetail.timestamp).toISOString()}

Linked Operational Events (Chronological Evidence Timeline):
${JSON.stringify(
  alertDetail.events.map((e) => ({
    eventId: e.id,
    timestamp: new Date(e.timestamp).toISOString(),
    source: e.source,
    type: e.type,
    message: e.message,
    role: e.role,
    payload: e.payload,
  })),
  null,
  2,
)}

Operator Follow-Up Notes:
${JSON.stringify(
  alertDetail.notes.map((n) => ({
    text: n.text,
    createdAt: new Date(n.createdAt).toISOString(),
  })),
  null,
  2,
)}

Task:
Analyze this incident evidence chain. Explain what happened before the alert fired, identify the most likely trigger condition, cite specific event IDs as evidence, and suggest safe physical/SCADA checks for the technician.
`;

      const response = await this.aiClient.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: incidentExplanationSchema,
          systemInstruction:
            'You are a renewable operations safety assistant. You provide grounded, evidence-based technical explanations. Do not hallucinate event IDs not present in the input.',
        },
      });

      if (!response.text) {
        throw new Error('Gemini returned an empty explanation');
      }

      return JSON.parse(response.text) as IncidentExplanation;
    } catch (error) {
      console.warn('⚠️ Gemini incident explanation failed:', error);
      throw new Error('Failed to generate incident explanation', { cause: error });
    }
  }
}
