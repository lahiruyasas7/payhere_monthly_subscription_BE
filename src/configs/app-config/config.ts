// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();
export const applicationConfig = {
    database: {
        databaseUrl: process.env[`DATABASE_URL`],
    }
}