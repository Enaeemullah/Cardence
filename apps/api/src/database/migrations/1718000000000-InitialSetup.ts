import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class InitialSetup1718000000000 implements MigrationInterface {
  name = 'InitialSetup1718000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'cardence_meta',
        columns: [
          {
            name: 'meta_key',
            type: 'varchar',
            length: '100',
            isPrimary: true,
          },
          {
            name: 'meta_value',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.query(
      `INSERT INTO cardence_meta (meta_key, meta_value) VALUES ('schema_version', '1')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('cardence_meta');
  }
}
