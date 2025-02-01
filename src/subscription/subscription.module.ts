import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PayHereService } from 'src/utils/payhere.service';

@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService, PayHereService],
})
export class SubscriptionModule {}
