import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMakerCheckerRequests1718000010000 implements MigrationInterface {
  name = 'CreateMakerCheckerRequests1718000010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE maker_checker_requests (
        id                VARCHAR(36) NOT NULL,
        type              ENUM('CARD_ISSUANCE','LIMIT_CHANGE') NOT NULL,
        initiator_user_id VARCHAR(36) NOT NULL,
        approver_user_id  VARCHAR(36) NULL,
        status            ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
        payload           JSON        NOT NULL,
        created_at        TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at        TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        decided_at        TIMESTAMP   NULL,
        PRIMARY KEY (id),
        KEY idx_maker_checker_status    (status),
        KEY idx_maker_checker_initiator (initiator_user_id),
        CONSTRAINT fk_maker_checker_initiator FOREIGN KEY (initiator_user_id) REFERENCES users (id),
        CONSTRAINT fk_maker_checker_approver  FOREIGN KEY (approver_user_id)  REFERENCES users (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE maker_checker_requests`);
  }
}
