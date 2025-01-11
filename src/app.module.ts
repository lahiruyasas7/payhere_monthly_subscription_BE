import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SubscriptionModule } from './subscription/subscription.module';
import { AppConfigModule } from './configs/app-config/app.config.module';
import { DatabaseConfig } from './configs/database-configs/databse-config.module';
import { PrismaService } from './configs/database-configs/prisma.service';
import { PrismaModule } from './configs/database-configs/prisma.module';

@Module({
  imports: [AppConfigModule, DatabaseConfig, SubscriptionModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
