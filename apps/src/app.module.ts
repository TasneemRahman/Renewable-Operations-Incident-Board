import { Module } from '@nestjs/common';
import { AlertsModule } from './alerts/alerts.module';

@Module({
  imports: [AlertsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

