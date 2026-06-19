import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePostingEntries1718000007000 implements MigrationInterface {
  name = 'CreatePostingEntries1718000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE posting_entries (
        id                        VARCHAR(36) NOT NULL,
        transaction_id            VARCHAR(36) NOT NULL,
        account_id                VARCHAR(36) NOT NULL,
        direction                 ENUM('DEBIT','CREDIT') NOT NULL,
        amount_minor_units        BIGINT NOT NULL,
        balance_after_minor_units BIGINT NOT NULL,
        posted_at                 TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_posting_entries_txn     (transaction_id),
        KEY idx_posting_entries_account (account_id),
        KEY idx_posting_entries_posted  (posted_at),
        CONSTRAINT fk_posting_entries_txn     FOREIGN KEY (transaction_id) REFERENCES transactions (id),
        CONSTRAINT fk_posting_entries_account FOREIGN KEY (account_id)     REFERENCES accounts     (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE posting_entries`);
  }
}
