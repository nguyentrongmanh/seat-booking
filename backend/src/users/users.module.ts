import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './users.service';
import { USERS_REPOSITORY, USERS_SERVICE } from './users.constants';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    { provide: USERS_REPOSITORY, useClass: UsersRepository },
    { provide: USERS_SERVICE, useClass: UsersService },
  ],
  exports: [USERS_SERVICE],
})
export class UsersModule {}
