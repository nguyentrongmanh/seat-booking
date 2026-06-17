import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TestAppModule } from './test-app.module';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { GlobalExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';
import { LoggingInterceptor } from '../../src/common/interceptors/logging.interceptor';

export const TEST_PORT = 3099;

export async function createTestApp(): Promise<INestApplication> {
  // Must be set before module creation so appConfig.port resolves to TEST_PORT,
  // allowing PaymentsService.dispatchWebhook() to call back to the test server.
  process.env.PORT = String(TEST_PORT);

  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [TestAppModule],
  }).compile();

  const app = moduleRef.createNestApplication({ rawBody: true });
  const reflector = app.get(Reflector);

  app.useGlobalGuards(new JwtAuthGuard(reflector));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  await app.listen(TEST_PORT);
  return app;
}
