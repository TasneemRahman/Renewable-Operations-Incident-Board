import { AlertsService } from '../src/alerts/alerts.service';
import { db, sqlite } from '../src/db/db';
import { alertEvents, alerts, followUpNotes, operationalEvents } from '../src/db/schema';

describe('Alerts service (integration)', () => {
  let service: AlertsService;

  beforeEach(async () => {
    sqlite.exec('DELETE FROM follow_up_notes; DELETE FROM alert_events; DELETE FROM alerts; DELETE FROM operational_events;');

    await db.insert(operationalEvents).values([
      {
        id: 'event-temperature',
        site: 'North Ridge',
        timestamp: new Date('2026-01-01T10:00:00Z'),
        source: 'inverter-01',
        type: 'temperature_reading',
        message: 'Inverter temperature reached 78C',
        payload: { value: 78, unit: 'C' },
      },
      {
        id: 'event-fan',
        site: 'North Ridge',
        timestamp: new Date('2026-01-01T10:05:00Z'),
        source: 'cooling-fan-01',
        type: 'fan_fault',
        message: 'Cooling fan stopped',
        payload: { value: 0, unit: 'rpm' },
      },
    ]);
    await db.insert(alerts).values([
      {
        id: 'alert-north',
        site: 'North Ridge',
        timestamp: new Date('2026-01-01T10:05:00Z'),
        type: 'inverter_high_temperature',
        severity: 'critical',
        description: 'Inverter overheating',
        status: 'open',
      },
      {
        id: 'alert-south',
        site: 'South Field',
        timestamp: new Date('2026-01-01T09:00:00Z'),
        type: 'low_output',
        severity: 'medium',
        description: 'Output below expected level',
        status: 'resolved',
      },
    ]);
    await db.insert(alertEvents).values([
      { alertId: 'alert-north', eventId: 'event-fan', role: 'trigger' },
      { alertId: 'alert-north', eventId: 'event-temperature', role: 'context' },
    ]);

    service = new AlertsService({ explainIncident: jest.fn() } as never);
  });

  it('lists alerts with all supported filters', async () => {
    const result = await service.getAlerts({ site: 'North Ridge', severity: 'critical', status: 'open' });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'alert-north', site: 'North Ridge', severity: 'critical' });
  });

  it('returns linked evidence in chronological order with its roles and notes', async () => {
    await db.insert(followUpNotes).values({
      id: 'note-1',
      alertId: 'alert-north',
      text: 'Technician dispatched',
      createdAt: new Date('2026-01-01T10:10:00Z'),
    });

    const result = await service.getAlertDetail('alert-north');

    expect(result.events.map((event) => event.id)).toEqual(['event-temperature', 'event-fan']);
    expect(result.events.map((event) => event.role)).toEqual(['context', 'trigger']);
    expect(result.notes).toEqual([expect.objectContaining({ text: 'Technician dispatched' })]);
  });

  it('persists status changes and follow-up notes', async () => {
    await expect(service.updateStatus('alert-north', 'investigating')).resolves.toMatchObject({
      id: 'alert-north',
      status: 'investigating',
    });

    await expect(service.addNote('alert-north', 'Check fan controller')).resolves.toMatchObject({
      alertId: 'alert-north',
      text: 'Check fan controller',
    });

    await expect(service.getAlertDetail('alert-north')).resolves.toEqual(
      expect.objectContaining({
        status: 'investigating',
        notes: [expect.objectContaining({ text: 'Check fan controller' })],
      }),
    );
  });

  it('throws NotFoundException for an unknown alert', async () => {
    await expect(service.getAlertDetail('missing')).rejects.toMatchObject({
      status: 404,
      message: 'Alert with ID missing not found',
    });
    await expect(service.updateStatus('missing', 'resolved')).rejects.toMatchObject({ status: 404 });
    await expect(service.addNote('missing', 'ignored')).rejects.toMatchObject({ status: 404 });
  });
});
