import { randomUUID } from 'crypto';
import { db, sqlite, initDb } from './db';
import { operationalEvents, alerts, alertEvents, followUpNotes } from './schema';
import { NewOperationalEvent, NewAlert, NewAlertEvent, NewFollowUpNote } from './types';

export async function seed() {
  console.log('🌱 Starting database seed with UUIDs...');
  initDb();

  // Clean existing records
  sqlite.exec(`
    DELETE FROM follow_up_notes;
    DELETE FROM alert_events;
    DELETE FROM alerts;
    DELETE FROM operational_events;
  `);

  const now = Date.now();
  const minute = 60 * 1000;
  const hour = 60 * minute;

  const eventsToInsert: NewOperationalEvent[] = [];
  const alertsToInsert: NewAlert[] = [];
  const alertEventsToInsert: NewAlertEvent[] = [];
  const notesToInsert: NewFollowUpNote[] = [];

  // ==========================================
  // INCIDENT 1 (Rich Chain): Dubbo Solar - Inverter 03 Overheat
  // ==========================================
  const inc1Time = now - 25 * minute;
  const inc1AlertId = randomUUID();
  const inc1Evt1Id = randomUUID();
  const inc1Evt2Id = randomUUID();
  const inc1Evt3Id = randomUUID();
  const inc1Evt4Id = randomUUID();

  const inc1Events: NewOperationalEvent[] = [
    {
      id: inc1Evt1Id,
      site: 'Dubbo Solar Farm',
      timestamp: new Date(inc1Time - 4 * minute),
      source: 'inverter-03',
      type: 'temperature_reading',
      message: 'Inverter 03 internal temperature nominal (68°C)',
      payload: { value: 68, unit: '°C' },
    },
    {
      id: inc1Evt2Id,
      site: 'Dubbo Solar Farm',
      timestamp: new Date(inc1Time - 3 * minute),
      source: 'inverter-03',
      type: 'temperature_reading',
      message: 'Inverter 03 temperature elevated to 72°C',
      payload: { value: 72, unit: '°C', previousValue: 68 },
    },
    {
      id: inc1Evt3Id,
      site: 'Dubbo Solar Farm',
      timestamp: new Date(inc1Time - 2 * minute),
      source: 'cooling-fan-03',
      type: 'fan_speed',
      message: 'Cooling fan 03 stopped unexpectedly (0 RPM)',
      payload: { value: 0, unit: 'RPM', previousValue: 2400 },
    },
    {
      id: inc1Evt4Id,
      site: 'Dubbo Solar Farm',
      timestamp: new Date(inc1Time),
      source: 'inverter-03',
      type: 'temperature_reading',
      message: 'Inverter 03 temperature exceeded operational threshold at 78°C',
      payload: { value: 78, unit: '°C', threshold: 75, previousValue: 72 },
    },
  ];

  eventsToInsert.push(...inc1Events);

  alertsToInsert.push({
    id: inc1AlertId,
    site: 'Dubbo Solar Farm',
    timestamp: new Date(inc1Time),
    type: 'inverter_high_temperature',
    severity: 'high',
    description: 'High temperature warning on Inverter 03 (78°C exceeded 75°C threshold)',
    status: 'investigating',
  });

  alertEventsToInsert.push(
    { alertId: inc1AlertId, eventId: inc1Evt1Id, role: 'context' },
    { alertId: inc1AlertId, eventId: inc1Evt2Id, role: 'context' },
    { alertId: inc1AlertId, eventId: inc1Evt3Id, role: 'context' },
    { alertId: inc1AlertId, eventId: inc1Evt4Id, role: 'trigger' },
  );

  notesToInsert.push({
    id: randomUUID(),
    alertId: inc1AlertId,
    text: 'Notified on-site electrical technician to inspect cooling-fan-03 fuse.',
    createdAt: new Date(inc1Time + 5 * minute),
  });

  // ==========================================
  // INCIDENT 2 (Rich Chain): Darlington Point BESS - Thermal Runaway Risk
  // ==========================================
  const inc2Time = now - 50 * minute;
  const inc2AlertId = randomUUID();
  const inc2Evt1Id = randomUUID();
  const inc2Evt2Id = randomUUID();
  const inc2Evt3Id = randomUUID();

  const inc2Events: NewOperationalEvent[] = [
    {
      id: inc2Evt1Id,
      site: 'Darlington Point BESS',
      timestamp: new Date(inc2Time - 6 * minute),
      source: 'BESS-Rack-04',
      type: 'temperature_reading',
      message: 'BESS Rack 04 module temperature steady at 48°C',
      payload: { value: 48, unit: '°C' },
    },
    {
      id: inc2Evt2Id,
      site: 'Darlington Point BESS',
      timestamp: new Date(inc2Time - 3 * minute),
      source: 'HVAC-BESS-02',
      type: 'cooling_status',
      message: 'HVAC Unit 02 compressor differential pressure low alert',
      payload: { status: 'degraded', unitId: 'HVAC-02' },
    },
    {
      id: inc2Evt3Id,
      site: 'Darlington Point BESS',
      timestamp: new Date(inc2Time),
      source: 'BESS-Rack-04',
      type: 'temperature_reading',
      message: 'BESS Rack 04 cell temperature crossed critical 58°C threshold',
      payload: { value: 58, unit: '°C', threshold: 55, previousValue: 48 },
    },
  ];

  eventsToInsert.push(...inc2Events);

  alertsToInsert.push({
    id: inc2AlertId,
    site: 'Darlington Point BESS',
    timestamp: new Date(inc2Time),
    type: 'battery_high_temperature',
    severity: 'critical',
    description: 'CRITICAL: BESS Rack 04 temperature reached 58°C (>55°C safe limit)',
    status: 'open',
  });

  alertEventsToInsert.push(
    { alertId: inc2AlertId, eventId: inc2Evt1Id, role: 'context' },
    { alertId: inc2AlertId, eventId: inc2Evt2Id, role: 'context' },
    { alertId: inc2AlertId, eventId: inc2Evt3Id, role: 'trigger' },
  );

  // ==========================================
  // INCIDENT 3 (Rich Chain): Broken Hill Solar - Sudden Output Curtailment
  // ==========================================
  const inc3Time = now - 2 * hour;
  const inc3AlertId = randomUUID();
  const inc3Evt1Id = randomUUID();
  const inc3Evt2Id = randomUUID();
  const inc3Evt3Id = randomUUID();

  const inc3Events: NewOperationalEvent[] = [
    {
      id: inc3Evt1Id,
      site: 'Broken Hill Solar Plant',
      timestamp: new Date(inc3Time - 5 * minute),
      source: 'SCADA-Grid-Meter',
      type: 'grid_voltage',
      message: 'Grid feeder voltage fluctuation detected: 33.8kV (+4%)',
      payload: { value: 33.8, unit: 'kV' },
    },
    {
      id: inc3Evt2Id,
      site: 'Broken Hill Solar Plant',
      timestamp: new Date(inc3Time - 2 * minute),
      source: 'inverter-cluster-01',
      type: 'output_reading',
      message: 'Cluster output steady at 4500 kW',
      payload: { value: 4500, unit: 'kW' },
    },
    {
      id: inc3Evt3Id,
      site: 'Broken Hill Solar Plant',
      timestamp: new Date(inc3Time),
      source: 'inverter-cluster-01',
      type: 'output_change',
      message: 'Generation dropped precipitously from 4500 kW to 1800 kW (60% reduction)',
      payload: { value: 1800, previousValue: 4500, unit: 'kW', changePct: -60 },
    },
  ];

  eventsToInsert.push(...inc3Events);

  alertsToInsert.push({
    id: inc3AlertId,
    site: 'Broken Hill Solar Plant',
    timestamp: new Date(inc3Time),
    type: 'generation_drop',
    severity: 'medium',
    description: 'Sudden 60% generation drop on Inverter Cluster 01 (4500kW -> 1800kW)',
    status: 'resolved',
  });

  alertEventsToInsert.push(
    { alertId: inc3AlertId, eventId: inc3Evt1Id, role: 'context' },
    { alertId: inc3AlertId, eventId: inc3Evt2Id, role: 'context' },
    { alertId: inc3AlertId, eventId: inc3Evt3Id, role: 'trigger' },
  );

  notesToInsert.push({
    id: randomUUID(),
    alertId: inc3AlertId,
    text: 'AEMO dispatched network curtailment order due to transmission line constraints. System operated normally.',
    createdAt: new Date(inc3Time + 20 * minute),
  });

  // ==========================================
  // INCIDENT 4 (Rich Chain): Gannawarra Energy Storage - Comms Drop & Inverter Fault
  // ==========================================
  const inc4Time = now - 3 * hour;
  const inc4AlertId = randomUUID();
  const inc4Evt1Id = randomUUID();
  const inc4Evt2Id = randomUUID();

  const inc4Events: NewOperationalEvent[] = [
    {
      id: inc4Evt1Id,
      site: 'Gannawarra Energy Storage',
      timestamp: new Date(inc4Time - 10 * minute),
      source: 'RTU-Gateway-01',
      type: 'network_latency',
      message: 'RTU gateway packet loss increased to 45%',
      payload: { packetLoss: 45, unit: '%' },
    },
    {
      id: inc4Evt2Id,
      site: 'Gannawarra Energy Storage',
      timestamp: new Date(inc4Time),
      source: 'PCS-Inverter-02',
      type: 'communication_loss',
      message: 'PCS Inverter 02 lost heartbeat signal from master controller for >60s',
      payload: { timeoutSeconds: 65 },
    },
  ];

  eventsToInsert.push(...inc4Events);

  alertsToInsert.push({
    id: inc4AlertId,
    site: 'Gannawarra Energy Storage',
    timestamp: new Date(inc4Time),
    type: 'communication_loss',
    severity: 'high',
    description: 'Loss of SCADA heartbeat on PCS Inverter 02 (>60s timeout)',
    status: 'investigating',
  });

  alertEventsToInsert.push(
    { alertId: inc4AlertId, eventId: inc4Evt1Id, role: 'context' },
    { alertId: inc4AlertId, eventId: inc4Evt2Id, role: 'trigger' },
  );

  // ==========================================
  // ADDITIONAL REALISTIC ALERTS (Total 15 alerts across sites)
  // ==========================================
  const additionalAlertConfigs = [
    {
      site: 'Dubbo Solar Farm',
      timeOffset: 4 * hour,
      type: 'tracker_stall',
      severity: 'medium' as const,
      description: 'Single-axis tracker row 14 angular tracking deviation > 15 degrees',
      status: 'open' as const,
      source: 'tracker-row-14',
      message: 'Tracker motor stalled due to mechanical resistance',
    },
    {
      site: 'Darlington Point BESS',
      timeOffset: 6 * hour,
      type: 'string_voltage_imbalance',
      severity: 'low' as const,
      description: 'String 08 voltage imbalance detected (delta 18V vs array avg)',
      status: 'resolved' as const,
      source: 'string-monitor-08',
      message: 'Minor voltage variance on string 08',
    },
    {
      site: 'Broken Hill Solar Plant',
      timeOffset: 8 * hour,
      type: 'ground_fault_warning',
      severity: 'critical' as const,
      description: 'DC ground fault detected on Inverter 04 array input',
      status: 'open' as const,
      source: 'inverter-04',
      message: 'Low insulation resistance detected on DC positive pole (<50kΩ)',
    },
    {
      site: 'Gannawarra Energy Storage',
      timeOffset: 12 * hour,
      type: 'auxiliary_power_fault',
      severity: 'medium' as const,
      description: 'Auxiliary UPS battery system switched to backup power',
      status: 'resolved' as const,
      source: 'UPS-Aux-01',
      message: 'Grid input surge tripped main breaker; UPS active',
    },
    {
      site: 'Dubbo Solar Farm',
      timeOffset: 15 * hour,
      type: 'sensor_drift',
      severity: 'low' as const,
      description: 'Pyranometer 01 irradiance offset > 8% from reference satellite feed',
      status: 'open' as const,
      source: 'pyranometer-01',
      message: 'Sensor lens soiled, reading drift detected',
    },
    {
      site: 'Darlington Point BESS',
      timeOffset: 18 * hour,
      type: 'transformer_temperature',
      severity: 'high' as const,
      description: 'Step-up transformer 33/132kV top-oil temperature reached 85°C',
      status: 'investigating' as const,
      source: 'Transformer-01',
      message: 'Top-oil temperature exceeded 80°C threshold during peak charge',
    },
    {
      site: 'Broken Hill Solar Plant',
      timeOffset: 22 * hour,
      type: 'cooling_fan_fault',
      severity: 'medium' as const,
      description: 'Cooling fan on Combiner Box 06 abnormal vibration detected',
      status: 'open' as const,
      source: 'combiner-fan-06',
      message: 'Acoustic / vibration sensor alert on fan bearings',
    },
    {
      site: 'Gannawarra Energy Storage',
      timeOffset: 26 * hour,
      type: 'soc_drift',
      severity: 'low' as const,
      description: 'BMS State-of-Charge estimation divergence between string 1 & 2',
      status: 'resolved' as const,
      source: 'BMS-Master',
      message: 'SoC recalibration completed after full charge cycle',
    },
    {
      site: 'Dubbo Solar Farm',
      timeOffset: 30 * hour,
      type: 'surge_arrester_trip',
      severity: 'high' as const,
      description: 'Main DC combiner surge protection device (SPD) triggered',
      status: 'resolved' as const,
      source: 'SPD-Array-C',
      message: 'Lightning transient absorbed by SPD module; cartridge replacement required',
    },
    {
      site: 'Darlington Point BESS',
      timeOffset: 36 * hour,
      type: 'safety_interlock',
      severity: 'critical' as const,
      description: 'BESS Container 01 aerosol fire suppression system pre-alarm',
      status: 'resolved' as const,
      source: 'Fire-Control-01',
      message: 'Optical smoke detector triggered; confirmed false alarm due to dust during filter cleaning',
    },
    {
      site: 'Broken Hill Solar Plant',
      timeOffset: 48 * hour,
      type: 'weather_stow_event',
      severity: 'medium' as const,
      description: 'High wind gusts (>75 km/h) initiated automated tracker stow sequence',
      status: 'resolved' as const,
      source: 'Anemometer-01',
      message: 'Sustained wind speed exceeded safety threshold; arrays safely stowed flat',
    },
  ];

  additionalAlertConfigs.forEach((cfg) => {
    const alertId = randomUUID();
    const eventId = randomUUID();
    const eventTime = new Date(now - cfg.timeOffset);

    eventsToInsert.push({
      id: eventId,
      site: cfg.site,
      timestamp: eventTime,
      source: cfg.source,
      type: cfg.type,
      message: cfg.message,
      payload: { status: 'triggered' },
    });

    alertsToInsert.push({
      id: alertId,
      site: cfg.site,
      timestamp: eventTime,
      type: cfg.type,
      severity: cfg.severity,
      description: cfg.description,
      status: cfg.status,
    });

    alertEventsToInsert.push({
      alertId,
      eventId,
      role: 'trigger',
    });
  });

  // Batch insert into SQLite
  await db.insert(operationalEvents).values(eventsToInsert);
  await db.insert(alerts).values(alertsToInsert);
  await db.insert(alertEvents).values(alertEventsToInsert);
  await db.insert(followUpNotes).values(notesToInsert);

  console.log(
    `✅ Database seeded successfully with UUIDs: ${alertsToInsert.length} alerts, ${eventsToInsert.length} events, ${notesToInsert.length} notes.`,
  );
}

// Execute directly if run via CLI
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
