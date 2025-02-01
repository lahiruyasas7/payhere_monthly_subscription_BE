import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/configs/database-configs/prisma.service';

@Injectable()
export class SubscriptionService {
private readonly logger = new Logger(SubscriptionService.name);
  constructor(private readonly prisma: PrismaService) {}
  /**
   * This method updates the payment_eligibility for users
   * that are 3 months old.
   */
  async updatePaymentEligibility(): Promise<void> {
    const today = new Date();
    const threeMonthsBoundary = new Date(
      today.getFullYear(),
      today.getMonth() - 3,
      28,
    );

    try {
      const updatedUsers = await this.prisma.user.updateMany({
        where: {
          created_at: { lte: threeMonthsBoundary },
          payment_eligibility: false,
        },
        data: {
          payment_eligibility: true,
        },
      });

      this.logger.log(
        `Payment eligibility updated for ${updatedUsers.count} Users.`,
      );

      // Retrieve all users with payment_eligibility = true
      const eligibleUsers = await this.prisma.user.findMany({
        where: {
          payment_eligibility: true,
          OR: [
            { subscription: { status: { not: 'ACTIVE' } } },
            { subscription: null }, // Include users without a subscription
          ],
        },
        select: {
          email: true, // Ensure email is included in the result
        },
      });

      // Send emails to eligible users
    //   for (const tenant of eligibleTenants) {
    //     if (tenant.email) {
    //       await this.mailService.sendUserMailSubscription(
    //         tenant.email,
    //         'You need to subscribe.',
    //       );
    //       this.logger.log(`Email sent to: ${tenant.email}`);
    //     }
    //   }
    } catch (error) {
      this.logger.error('Error updating payment eligibility', error);
    }
  }

  /**
   * Run the updatePaymentEligibility method 3 times per day.
   */
  @Cron(CronExpression.EVERY_HOUR) 
  handleCron() {
    this.logger.log('Running payment eligibility cron job...');
    this.updatePaymentEligibility();
  }

  //generate orderId for subscription preapproval payhere api
  private async generateOrderId(): Promise<string> {
    return await this.prisma.$transaction(async (prisma) => {
      let orderId = await prisma.subscribeCount.findFirst();

      if (!orderId) {
        orderId = await prisma.subscribeCount.create({
          data: { lastId: 0 },
        });
      }

      const newLastId = orderId.lastId + 1;

      await prisma.subscribeCount.update({
        where: { id: orderId.id },
        data: { lastId: newLastId },
      });

      const prefix = 'SB';
      const idLength = 8;
      const formattedId = newLastId.toString().padStart(idLength, '0');

      return `${prefix}${formattedId}`;
    });
  }
}
