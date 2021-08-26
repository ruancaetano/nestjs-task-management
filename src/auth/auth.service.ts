import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthCredentialDto } from './dto/auth-credential.dto';
import { UserRepository } from './user.repository';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { User } from './user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserRepository)
    private usersRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async singUp(authCredentialDto: AuthCredentialDto): Promise<User> {
    return this.usersRepository.createUser(authCredentialDto);
  }

  async singIn(
    authCredentialDto: AuthCredentialDto,
  ): Promise<{ accessToken: string }> {
    const { username, password } = authCredentialDto;

    const user = await this.usersRepository.findOne({
      username,
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const jwtPayload: JwtPayloadDto = {
        username,
      };
      const accessToken = await this.jwtService.sign(jwtPayload);
      return { accessToken };
    }

    throw new UnauthorizedException('Please check your credentials');
  }
}
