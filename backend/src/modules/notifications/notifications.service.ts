import { Injectable } from '@nestjs/common';
import { NotificationChannel, NotificationStatus, NotificationType, Prisma } from '@prisma/client';

import { PrismaService } from '@database/prisma/prisma.service';
import { NotificationQueueService } from './notification-queue.service';

type Recipient = {
  userId?: string;
  phone?: string | null;
  email?: string | null;
};

type EnqueueInput = {
  chamberId?: string;
  recipient: Recipient;
  type: NotificationType;
  dedupeKey: string;
  payload: Prisma.InputJsonValue;
  scheduledAt?: Date;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: NotificationQueueService,
  ) {}

  async appointmentConfirmed(appointmentId: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        chamberId: true,
        scheduledAt: true,
        patient: { select: { phone: true, email: true } },
      },
    });
    if (!appointment) return;
    await this.enqueueForRecipient({
      chamberId: appointment.chamberId,
      recipient: appointment.patient,
      type: NotificationType.APPOINTMENT_CONFIRMATION,
      dedupeKey: `appointment-confirmed:${appointment.id}`,
      payload: {
        appointmentId: appointment.id,
        scheduledAt: appointment.scheduledAt.toISOString(),
      },
    });
  }

  async scheduleAppointmentReminder(appointmentId: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        chamberId: true,
        scheduledAt: true,
        patient: { select: { phone: true, email: true } },
      },
    });
    if (!appointment) return;
    const scheduledAt = new Date(appointment.scheduledAt.getTime() - 24 * 60 * 60 * 1_000);
    if (scheduledAt <= new Date()) return;
    await this.enqueueForRecipient({
      chamberId: appointment.chamberId,
      recipient: appointment.patient,
      type: NotificationType.APPOINTMENT_REMINDER,
      dedupeKey: `appointment-reminder:${appointment.id}`,
      payload: {
        appointmentId: appointment.id,
        scheduledAt: appointment.scheduledAt.toISOString(),
      },
      scheduledAt,
    });
  }

  async queueCalled(queueEntryId: string): Promise<void> {
    const entry = await this.prisma.queueEntry.findUnique({
      where: { id: queueEntryId },
      select: {
        id: true,
        chamberId: true,
        queueNumber: true,
        patient: { select: { phone: true, email: true } },
      },
    });
    if (!entry) return;
    await this.enqueueForRecipient({
      chamberId: entry.chamberId,
      recipient: entry.patient,
      type: NotificationType.QUEUE_UPDATE,
      dedupeKey: `queue-called:${entry.id}`,
      payload: { queueEntryId: entry.id, queueNumber: entry.queueNumber, status: 'CALLED' },
    });
  }

  async prescriptionReady(prescriptionId: string): Promise<void> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      select: {
        id: true,
        chamberId: true,
        prescriptionNumber: true,
        patient: { select: { phone: true, email: true } },
      },
    });
    if (!prescription) return;
    await this.enqueueForRecipient({
      chamberId: prescription.chamberId,
      recipient: prescription.patient,
      type: NotificationType.PRESCRIPTION_READY,
      dedupeKey: `prescription-ready:${prescription.id}`,
      payload: {
        prescriptionId: prescription.id,
        prescriptionNumber: prescription.prescriptionNumber,
      },
    });
  }

  async paymentReceipt(paymentId: string): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        chamberId: true,
        paymentNumber: true,
        amount: true,
        currency: true,
        patient: { select: { phone: true, email: true } },
      },
    });
    if (!payment) return;
    await this.enqueueForRecipient({
      chamberId: payment.chamberId,
      recipient: payment.patient,
      type: NotificationType.PAYMENT_RECEIPT,
      dedupeKey: `payment-receipt:${payment.id}`,
      payload: {
        paymentId: payment.id,
        paymentNumber: payment.paymentNumber,
        amount: payment.amount.toString(),
        currency: payment.currency,
      },
    });
  }

  async staffInvitation(membershipId: string): Promise<void> {
    const membership = await this.prisma.chamberMembership.findUnique({
      where: { id: membershipId },
      select: {
        id: true,
        chamberId: true,
        userId: true,
        role: true,
        user: { select: { phone: true, email: true } },
      },
    });
    if (!membership) return;
    await this.enqueueForRecipient({
      chamberId: membership.chamberId,
      recipient: { userId: membership.userId, ...membership.user },
      type: NotificationType.STAFF_INVITATION,
      dedupeKey: `staff-invitation:${membership.id}`,
      payload: { membershipId: membership.id, role: membership.role },
    });
  }

  private async enqueueForRecipient(input: EnqueueInput): Promise<void> {
    const channels: NotificationChannel[] = [
      ...(input.recipient.phone ? [NotificationChannel.SMS] : []),
      ...(input.recipient.email ? [NotificationChannel.EMAIL] : []),
      ...(input.recipient.userId ? [NotificationChannel.PUSH] : []),
    ];
    await Promise.all(
      channels.map((channel) =>
        this.createAndQueue({
          ...input,
          dedupeKey: `${input.dedupeKey}:${channel.toLowerCase()}`,
          channel,
        }),
      ),
    );
  }

  private async createAndQueue(
    input: EnqueueInput & { channel: NotificationChannel },
  ): Promise<void> {
    const scheduledAt = input.scheduledAt ?? new Date();
    try {
      const notification = await this.prisma.notification.create({
        data: {
          chamberId: input.chamberId,
          recipientUserId: input.recipient.userId,
          recipientPhone: input.recipient.phone,
          recipientEmail: input.recipient.email,
          type: input.type,
          channel: input.channel,
          dedupeKey: input.dedupeKey,
          payload: input.payload,
          scheduledAt,
        },
      });
      await this.queue.enqueue(notification.id, scheduledAt);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return;
      }
      throw error;
    }
  }

  async pendingCount(chamberId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { chamberId, status: { in: [NotificationStatus.PENDING, NotificationStatus.FAILED] } },
    });
  }
}
