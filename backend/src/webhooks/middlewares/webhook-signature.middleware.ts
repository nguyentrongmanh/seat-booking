import { Inject, Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import * as crypto from 'crypto';
import paymentConfig from '../../config/payment.config';

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@Injectable()
export class WebhookSignatureMiddleware implements NestMiddleware {
  constructor(
    @Inject(paymentConfig.KEY)
    private readonly paymentConf: ConfigType<typeof paymentConfig>,
  ) {}

  use(req: RawBodyRequest, _res: Response, next: NextFunction): void {
    const signature = req.headers['x-payment-signature'] as string;

    if (!signature) {
      throw new UnauthorizedException('Missing X-Payment-Signature header');
    }

    if (!req.rawBody) {
      throw new UnauthorizedException('Raw body unavailable for signature verification');
    }

    const expected = `sha256=${crypto
      .createHmac('sha256', this.paymentConf.webhookSecret)
      .update(req.rawBody)
      .digest('hex')}`;

    const sigBuf = Buffer.from(signature.padEnd(expected.length));
    const expBuf = Buffer.from(expected);

    // Constant-time comparison prevents timing attacks
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    next();
  }
}
