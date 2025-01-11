import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/configs/database-configs/prisma.service';

@Injectable()
export class SubscriptionService {
private readonly logger = new Logger(SubscriptionService.name);
  constructor(private readonly prisma: PrismaService) {}
  /**
   * This method updates the payment_eligibility for tenants
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
      const updatedTenants = await this.prisma.user.updateMany({
        where: {
          created_at: { lte: threeMonthsBoundary },
          payment_eligibility: false,
        },
        data: {
          payment_eligibility: true,
        },
      });

      this.logger.log(
        `Payment eligibility updated for ${updatedTenants.count} tenants.`,
      );

      // Retrieve all tenants with payment_eligibility = true
      const eligibleTenants = await this.prisma.user.findMany({
        where: {
          payment_eligibility: true,
          OR: [
            { subscription: { status: { not: 'ACTIVE' } } },
            { subscription: null }, // Include tenants without a subscription
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
}
