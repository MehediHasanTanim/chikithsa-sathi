import { Injectable, Logger } from '@nestjs/common';

import { NotificationsService } from '@modules/notifications/notifications.service';

@Injectable()
export class AppointmentEventsService {
  private readonly logger = new Logger(AppointmentEventsService.name);

  constructor(private readonly notifications: NotificationsService) {}

  confirmed(appointmentId: string): void {
    void Promise.all([
      this.notifications.appointmentConfirmed(appointmentId),
      this.notifications.scheduleAppointmentReminder(appointmentId),
    ]).catch((error: unknown) => {
      this.logger.error({ event: 'appointment.notification_enqueue_failed', appointmentId, error });
    });
  }
}
