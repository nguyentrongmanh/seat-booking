import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1750165200000 implements MigrationInterface {
  name = 'InitialSchema1750165200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"        uuid                NOT NULL DEFAULT gen_random_uuid(),
        "email"     character varying   NOT NULL,
        "name"      character varying   NOT NULL,
        "password"  character varying   NOT NULL,
        "createdAt" TIMESTAMP           NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP           NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "seats" (
        "id"        uuid                NOT NULL DEFAULT gen_random_uuid(),
        "number"    integer             NOT NULL,
        "label"     character varying   NOT NULL,
        "createdAt" TIMESTAMP           NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP           NOT NULL DEFAULT now(),
        CONSTRAINT "PK_seats" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "reservations_status_enum" AS ENUM ('pending', 'confirmed', 'cancelled')
    `);

    await queryRunner.query(`
      CREATE TABLE "reservations" (
        "id"        uuid                          NOT NULL DEFAULT gen_random_uuid(),
        "userId"    uuid                          NOT NULL,
        "seatId"    uuid                          NOT NULL,
        "status"    "reservations_status_enum"    NOT NULL DEFAULT 'pending',
        "expiresAt" TIMESTAMP WITH TIME ZONE      NOT NULL,
        "createdAt" TIMESTAMP                     NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP                     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reservations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reservations_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reservations_seat" FOREIGN KEY ("seatId") REFERENCES "seats"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "payments_status_enum" AS ENUM ('pending', 'completed', 'failed')
    `);

    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id"            uuid                      NOT NULL DEFAULT gen_random_uuid(),
        "reservationId" uuid                      NOT NULL,
        "amount"        numeric(10,2)             NOT NULL DEFAULT '50',
        "status"        "payments_status_enum"    NOT NULL DEFAULT 'pending',
        "transactionId" character varying,
        "createdAt"     TIMESTAMP                 NOT NULL DEFAULT now(),
        "updatedAt"     TIMESTAMP                 NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_payments_reservation" UNIQUE ("reservationId"),
        CONSTRAINT "PK_payments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payments_reservation" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "payments_status_enum"`);
    await queryRunner.query(`DROP TABLE "reservations"`);
    await queryRunner.query(`DROP TYPE "reservations_status_enum"`);
    await queryRunner.query(`DROP TABLE "seats"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
