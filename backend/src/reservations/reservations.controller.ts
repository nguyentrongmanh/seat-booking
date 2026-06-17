import { Body, Controller, Get, Inject, NotFoundException, Param, Post } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { RESERVATIONS_SERVICE } from './reservations.constants';
import { IReservationsService } from './interfaces/reservations-service.interface';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(
    @Inject(RESERVATIONS_SERVICE)
    private readonly reservationsService: IReservationsService,
  ) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReservationDto) {
    return this.reservationsService.create(user.id, dto);
  }

  @Get('my')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.reservationsService.findByUser(user.id);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const reservation = await this.reservationsService.findById(id);
    if (!reservation) throw new NotFoundException('Reservation not found');
    return reservation;
  }
}
