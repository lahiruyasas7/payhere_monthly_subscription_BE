import { registerAs } from '@nestjs/config';
import { applicationConfig } from './config';

export default registerAs('app', () => ({
  // Database Config
  database: {
    databaseUrl: applicationConfig.database.databaseUrl,
  },
}));
