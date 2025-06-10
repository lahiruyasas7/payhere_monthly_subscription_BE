import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/configs/database-configs/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { PayHereService } from 'src/utils/payhere.service';
import { SubscriptionPaymentStatus, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly payHereService: PayHereService,
  ) {}
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

  /**
   * method for created subscription
   * @param createSubscriptionDto
   * @returns
   */
  async createSubscription(createSubscriptionDto: CreateSubscriptionDto) {
    const { items, totalAmount, user } = createSubscriptionDto;

    // check user in database
    const selectedUser = await this.prisma.user.findUnique({
      where: { user_id: user.user_id },
      select: {
        user_id: true,
        payment_eligibility: true,
      },
    });
    if (!selectedUser) {
      this.logger.error('User not found');
      throw new NotFoundException('User not found');
    }
    this.logger.log(`User ID: ${user.user_id}`);

    if (!selectedUser.payment_eligibility) {
      this.logger.error(`User not eligible for payment: ${user.user_id}`);
      throw new ForbiddenException('User is not eligible for payment');
    }

    const orderId = await this.generateOrderId();
    // Generate PayHere pre-approval URL payload
    const preApprovalPayload = await this.payHereService.generatePreApprovalUrl(
      {
        order_id: orderId,
        items,
        totalAmount,
        user,
      },
    );

    // subscription data to the database
    await this.prisma.subscription.upsert({
      where: { user_id: user.user_id }, // Unique constraint
      update: {
        orderId,
        items,
        totalAmount,
        userEmail: user.email,
        status: SubscriptionStatus.PENDING,
        customer_token: '',
        updatedAt: new Date(),
      },
      create: {
        orderId,
        items,
        totalAmount,
        userEmail: user.email,
        status: SubscriptionStatus.PENDING,
        user_id: user.user_id,
        customer_token: '',
      },
    });

    this.logger.log(`Subscription created for Order ID: ${orderId}`);

    // Return pre-approval payload to the client
    return preApprovalPayload;
  }

  private getSubscriptionStatus(status: string): SubscriptionPaymentStatus {
    switch (status) {
      case '2':
        return SubscriptionPaymentStatus.SUCCESS;
      case '0':
        return SubscriptionPaymentStatus.PENDING;
      case '-1':
        return SubscriptionPaymentStatus.CANCELED;
      case '-2':
        return SubscriptionPaymentStatus.FAILED;
      default:
        return SubscriptionPaymentStatus.FAILED;
    }
  }

  async notifySubscribePayment(body: any) {
    try {
      const {
        merchant_id,
        order_id,
        payment_id,
        payhere_amount,
        payhere_currency,
        status_code,
        md5sig,
        status_message,
        customer_token,
      } = body;

      // Generate local md5sig
      const local_md5sig = this.payHereService.generateMd5sig(
        merchant_id,
        order_id,
        payhere_amount,
        payhere_currency,
        status_code,
      );

      this.logger.log('Check Subscription Status');
      let status = undefined;
      if (local_md5sig === md5sig) {
        status = this.getSubscriptionStatus(status_code);
        this.logger.log(`Subscription Status is ${status}`);
      } else {
        status = SubscriptionPaymentStatus.FAILED;
        this.logger.log('Subscription Status is FAILED');
      }

      const subscription = await this.prisma.subscription.findUnique({
        where: {
          orderId: order_id,
        },
        include: {
          user: true,
        },
      });
      if (subscription) {
        await this.prisma.subscription.update({
          where: { subscriptionId: subscription.subscriptionId },
          data: { customer_token: customer_token },
        });
        await this.prisma.subscriptionPayment.create({
          data: {
            subscriptionId: subscription.subscriptionId,
            md5sig,
            payhere_payment_id: payment_id,
            payhere_status_message: status_message,
            payment_amount: payhere_amount,
            payment_date: new Date().toISOString(),
            status,
          },
        });
        if (status === 'SUCCESS') {
          // await this.mailService.sendUserMailSubscription(
          //   subscription.tenant.email,
          //   'Your Subscription payment is Success.',
          // );
          // this.logger.log(`Email sent to: ${subscription.user.email}`);
          console.log('subscription payment success');
        } else {
          // await this.mailService.sendUserMailSubscription(
          //   subscription.user.email,
          //   'Your Subscription payment is Fail. Please try again.',
          // );
          // this.logger.log(`Email sent to: ${subscription.user.email}`);
          console.log('subscription payment failed');
        }
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
}
