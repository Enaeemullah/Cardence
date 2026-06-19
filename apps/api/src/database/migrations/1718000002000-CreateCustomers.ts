import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomers1718000002000 implements MigrationInterface {
  name = 'CreateCustomers1718000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE customers (
        id            VARCHAR(36)  NOT NULL,
        first_name    VARCHAR(100) NOT NULL,
        last_name     VARCHAR(100) NOT NULL,
        email         VARCHAR(255) NOT NULL,
        phone         VARCHAR(30)  NULL,
        date_of_birth DATE         NULL,
        created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_customers_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE customers`);
  }
}
