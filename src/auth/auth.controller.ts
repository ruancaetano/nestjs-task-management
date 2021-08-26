import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialDto } from './dto/auth-credential.dto';
import { User } from './user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  async singUp(@Body() authCredentialDto: AuthCredentialDto): Promise<User> {
    return this.authService.singUp(authCredentialDto);
  }

  @Post('/signin')
  async singIn(
    @Body() authCredentialDto: AuthCredentialDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.singIn(authCredentialDto);
  }
}
