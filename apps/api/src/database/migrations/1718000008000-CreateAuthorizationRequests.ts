import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthorizationRequests1718000008000 implements MigrationInterface {
  name = 'CreateAuthorizationRequests1718000008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE authorization_requests (
        id                 VARCHAR(36)  NOT NULL,
        card_id            VARCHAR(36)  NOT NULL,
        idempotency_key    VARCHAR(100) NOT NULL,
        channel            ENUM('ATM','POS','ECOM','INTL') NOT NULL,
        amount_minor_units BIGINT       NOT NULL,
        currency           CHAR(3)      NOT NULL,
        merchant_name      VARCHAR(200) NULL,
        merchant_code      VARCHAR(20)  NULL,
        result             ENUM('APPROVED','DECLINED') NOT NULL,
        decline_reason     VARCHAR(100) NULL,
        requested_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_auth_requests_idem_key (idempotency_key),
        KEY        idx_auth_requests_card    (card_id),
        KEY        idx_auth_requests_time    (requested_at),
        CONSTRAINT fk_auth_requests_card FOREIGN KEY (card_id) REFERENCES cards (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE authorization_requests`);
  }
}
