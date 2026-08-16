import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AiService } from '../ai/ai.service';

@Module({
  controllers: [AlertsController],
  providers: [AlertsService, AiService],
  exports: [AlertsService],
})
export class AlertsModule {}