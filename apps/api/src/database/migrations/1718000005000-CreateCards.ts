import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCards1718000005000 implements MigrationInterface {
  name = 'CreateCards1718000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE cards (
        id                        VARCHAR(36) NOT NULL,
        account_id                VARCHAR(36) NOT NULL,
        card_product_id           VARCHAR(36) NOT NULL,
        pan_token                 VARCHAR(64) NOT NULL,
        pan_last4                 CHAR(4)     NOT NULL,
        pan_masked                VARCHAR(25) NOT NULL,
        expiry_month              TINYINT UNSIGNED NOT NULL,
        expiry_year               SMALLINT UNSIGNED NOT NULL,
        status                    ENUM('REQUESTED','ISSUED','ACTIVE','BLOCKED','HOTLISTED','EXPIRED','CLOSED')
                                  NOT NULL DEFAULT 'REQUESTED',
        pin_block_hash            VARCHAR(255) NULL,
        daily_limit_minor_units   BIGINT NULL,
        per_txn_limit_minor_units BIGINT NULL,
        atm_enabled               TINYINT(1) NULL,
        pos_enabled               TINYINT(1) NULL,
        ecom_enabled              TINYINT(1) NULL,
        intl_enabled              TINYINT(1) NULL,
        parent_card_id            VARCHAR(36) NULL,
        created_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        closed_at                 TIMESTAMP NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_cards_pan_token (pan_token),
        KEY        idx_cards_account   (account_id),
        KEY        idx_cards_status    (status),
        KEY        idx_cards_parent    (parent_card_id),
        CONSTRAINT fk_cards_account    FOREIGN KEY (account_id)     REFERENCES accounts     (id),
        CONSTRAINT fk_cards_product    FOREIGN KEY (card_product_id) REFERENCES card_products (id),
        CONSTRAINT fk_cards_parent     FOREIGN KEY (parent_card_id) REFERENCES cards         (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE cards`);
  }
}
