import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthCredentialDto } from './dto/auth-credential.dto';
import { UsersRepository } from './users.repository';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadDto } from './dto/jwt-payload.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UsersRepository)
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
  ) {}

  async singUp(authCredentialDto: AuthCredentialDto): Promise<void> {
    await this.usersRepository.createUser(authCredentialDto);
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
