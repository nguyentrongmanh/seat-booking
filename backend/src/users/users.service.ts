import { Inject, Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { USERS_REPOSITORY } from './users.constants';
import { IUsersRepository } from './interfaces/users-repository.interface';
import { IUsersService } from './interfaces/users-service.interface';

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepo: IUsersRepository,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findByEmail(email);
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepo.findById(id);
  }

  create(data: { email: string; name: string; password: string }): Promise<User> {
    return this.usersRepo.create(data);
  }
}
