import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditEvents1718000009000 implements MigrationInterface {
  name = 'CreateAuditEvents1718000009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE audit_events (
        id             VARCHAR(36) NOT NULL,
        entity_type    VARCHAR(50) NOT NULL,
        entity_id      VARCHAR(36) NOT NULL,
        action         VARCHAR(80) NOT NULL,
        actor_user_id  VARCHAR(36) NULL,
        previous_state JSON NULL,
        new_state      JSON NULL,
        metadata       JSON NULL,
        occurred_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_audit_events_entity (entity_type, entity_id),
        KEY idx_audit_events_actor  (actor_user_id),
        KEY idx_audit_events_time   (occurred_at),
        CONSTRAINT fk_audit_events_actor FOREIGN KEY (actor_user_id) REFERENCES users (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE audit_events`);
  }
}
