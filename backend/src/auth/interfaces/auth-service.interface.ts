import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

export interface AuthTokenPayload {
  token: string;
  user: { id: string; email: string; name: string };
}

export interface IAuthService {
  register(dto: RegisterDto): Promise<AuthTokenPayload>;
  login(dto: LoginDto): Promise<AuthTokenPayload>;
  getMe(userId: string): Promise<{ id: string; email: string; name: string }>;
}
