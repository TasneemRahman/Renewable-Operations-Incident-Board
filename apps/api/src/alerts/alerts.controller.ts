import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import type { AlertSeverity, AlertStatus } from '../db/types';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async getAlerts(
    @Query('site') site?: string,
    @Query('severity') severity?: AlertSeverity,
    @Query('status') status?: AlertStatus,
  ) {
    return this.alertsService.getAlerts({
      site,
      severity,
      status,
    });
  }

  @Get(':id')
  async getAlertDetail(@Param('id') id: string) {
    return this.alertsService.getAlertDetail(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: AlertStatus,
  ) {
    return this.alertsService.updateStatus(id, status);
  }

  @Post(':id/notes')
  async addNote(
    @Param('id') id: string,
    @Body('text') text: string,
  ) {
    return this.alertsService.addNote(id, text);
  }

  @Post(':id/explain')
  async explainAlert(@Param('id') id: string) {
    return this.alertsService.explainAlert(id);
  }
}

