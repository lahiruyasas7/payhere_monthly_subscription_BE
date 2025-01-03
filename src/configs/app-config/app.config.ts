import { registerAs } from '@nestjs/config';
import { applicationConfig } from './config';

export default registerAs('app', () => ({
  // Database Config
  database: {
    databaseUrl: applicationConfig.database.databaseUrl,
  },
  // Payhere Config
  payhere: {
    merchantId: applicationConfig.payhere.merchantId,
    merchantSecret: applicationConfig.payhere.merchantSecret,
    chargeUrl: applicationConfig.payhere.chargeUrl,
    returnUrl: applicationConfig.payhere.returnUrl,
    cancelUrl: applicationConfig.payhere.cancelUrl,
    notifyUrl: applicationConfig.payhere.notifyUrl,
    currency: applicationConfig.payhere.currency,
    country: applicationConfig.payhere.country,
    authorizationCode: applicationConfig.payhere.authorizationCode,
    authUrl: applicationConfig.payhere.authUrl,
  },
}));
