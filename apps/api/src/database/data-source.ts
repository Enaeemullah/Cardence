import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';

// When the TypeORM CLI runs from apps/api/, resolve root .env two levels up
config({ path: resolve(process.cwd(), '../../.env') });
// Also attempt local .env in case the user places one under apps/api/
config({ path: resolve(process.cwd(), '.env'), override: false });

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3306', 10),
  username: process.env.DB_USER ?? 'cardence',
  password: process.env.DB_PASSWORD ?? 'cardence_dev',
  database: process.env.DB_NAME ?? 'cardence',
  entities: [resolve(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [resolve(__dirname, './migrations/*{.ts,.js}')],
  synchronize: false,
});
