import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWebhookEvents1750165300000 implements MigrationInterface {
  name = 'AddWebhookEvents1750165300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "webhook_events_status_enum" AS ENUM ('paid', 'skipped', 'failed')
    `);

    await queryRunner.query(`
      CREATE TABLE "webhook_events" (
        "id"        uuid                            NOT NULL DEFAULT gen_random_uuid(),
        "eventId"   character varying               NOT NULL,
        "type"      character varying               NOT NULL,
        "payload"   jsonb                           NOT NULL,
        "status"    "webhook_events_status_enum"    NOT NULL DEFAULT 'paid',
        "createdAt" TIMESTAMP                       NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP                       NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_webhook_events_eventId" UNIQUE ("eventId"),
        CONSTRAINT "PK_webhook_events" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_webhook_events_eventId" ON "webhook_events" ("eventId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_webhook_events_eventId"`);
    await queryRunner.query(`DROP TABLE "webhook_events"`);
    await queryRunner.query(`DROP TYPE "webhook_events_status_enum"`);
  }
}
