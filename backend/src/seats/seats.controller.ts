import { Controller, Get, Inject } from '@nestjs/common';
import { SEATS_SERVICE } from './seats.constants';
import { ISeatsService } from './interfaces/seats-service.interface';
import { Public } from '../common/decorators/public.decorator';

@Controller('seats')
export class SeatsController {
  constructor(
    @Inject(SEATS_SERVICE)
    private readonly seatsService: ISeatsService,
  ) {}

  @Public()
  @Get()
  findAll() {
    return this.seatsService.findAllWithStatus();
  }
}
