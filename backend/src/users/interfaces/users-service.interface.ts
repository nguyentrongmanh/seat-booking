import { User } from '../../entities/user.entity';

export interface IUsersService {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: { email: string; name: string; password: string }): Promise<User>;
}
