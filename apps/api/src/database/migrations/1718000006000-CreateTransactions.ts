import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransactions1718000006000 implements MigrationInterface {
  name = 'CreateTransactions1718000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE transactions (
        id               VARCHAR(36)  NOT NULL,
        card_id          VARCHAR(36)  NOT NULL,
        account_id       VARCHAR(36)  NOT NULL,
        reference_number VARCHAR(50)  NOT NULL,
        idempotency_key  VARCHAR(100) NOT NULL,
        type             ENUM('AUTHORIZATION','CLEARING','REVERSAL','FEE') NOT NULL,
        channel          ENUM('ATM','POS','ECOM','INTL') NOT NULL,
        amount_minor_units BIGINT     NOT NULL,
        currency         CHAR(3)      NOT NULL,
        merchant_name    VARCHAR(200) NULL,
        merchant_code    VARCHAR(20)  NULL,
        status           ENUM('APPROVED','DECLINED') NOT NULL,
        decline_reason   VARCHAR(100) NULL,
        posted_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_transactions_ref       (reference_number),
        UNIQUE KEY uq_transactions_idem_key  (idempotency_key),
        KEY        idx_transactions_card     (card_id),
        KEY        idx_transactions_account  (account_id),
        KEY        idx_transactions_posted   (posted_at),
        CONSTRAINT fk_transactions_card    FOREIGN KEY (card_id)    REFERENCES cards    (id),
        CONSTRAINT fk_transactions_account FOREIGN KEY (account_id) REFERENCES accounts (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE transactions`);
  }
}
