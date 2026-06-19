import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCardProducts1718000004000 implements MigrationInterface {
  name = 'CreateCardProducts1718000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE card_products (
        id                        VARCHAR(36)  NOT NULL,
        name                      VARCHAR(100) NOT NULL,
        network                   ENUM('VISA','MASTERCARD','AMEX') NOT NULL,
        product_type              ENUM('DEBIT','CREDIT','PREPAID') NOT NULL,
        daily_limit_minor_units   BIGINT NOT NULL,
        per_txn_limit_minor_units BIGINT NOT NULL,
        velocity_count            INT    NOT NULL,
        velocity_window_seconds   INT    NOT NULL,
        atm_enabled               TINYINT(1) NOT NULL DEFAULT 1,
        pos_enabled               TINYINT(1) NOT NULL DEFAULT 1,
        ecom_enabled              TINYINT(1) NOT NULL DEFAULT 1,
        intl_enabled              TINYINT(1) NOT NULL DEFAULT 0,
        created_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE card_products`);
  }
}
