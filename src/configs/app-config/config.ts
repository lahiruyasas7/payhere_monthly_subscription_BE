// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
export const applicationConfig = {
  port: parseInt(process.env[`APP_PORT`], 10) || 4000,
  database: {
    databaseUrl: process.env[`DATABASE_URL`],
  },
  payhere: {
    merchantId: process.env[`PAYHERE_MERCHANT_ID`],
    merchantSecret: process.env[`PAYHERE_MERCHANT_SECRET`],
    chargeUrl: process.env[`PAYHERE_CHARGE_URL`],
    returnUrl: process.env[`PAYHERE_RETURN_URL`],
    cancelUrl: process.env[`PAYHERE_CANCEL_URL`],
    notifyUrl: process.env[`PAYHERE_NOTIFY_URL`],
    currency: process.env[`PAYHERE_CURRENCY`],
    country: process.env[`PAYHERE_COUNTRY`],
    authorizationCode: process.env[`PAYHERE_AUTHORIZATION_CODE`],
    authUrl: process.env[`PAYHERE_AUTH_URL`],
  },
};
