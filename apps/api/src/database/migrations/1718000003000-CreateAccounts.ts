import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccounts1718000003000 implements MigrationInterface {
  name = 'CreateAccounts1718000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE accounts (
        id                   VARCHAR(36) NOT NULL,
        customer_id          VARCHAR(36) NOT NULL,
        account_number       VARCHAR(20) NOT NULL,
        currency             CHAR(3)     NOT NULL,
        balance_minor_units  BIGINT      NOT NULL DEFAULT 0,
        version              INT         NOT NULL DEFAULT 0,
        status               ENUM('ACTIVE','SUSPENDED','CLOSED') NOT NULL DEFAULT 'ACTIVE',
        created_at           TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at           TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_accounts_number (account_number),
        KEY        idx_accounts_customer (customer_id),
        CONSTRAINT fk_accounts_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE accounts`);
  }
}
