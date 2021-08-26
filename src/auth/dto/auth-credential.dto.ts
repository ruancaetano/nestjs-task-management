import { IsEmail, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthCredentialDto {
  @ApiProperty({
    description: 'User e-mail',
    example: 'email@email.com',
  })
  @IsEmail()
  username: string;

  @ApiProperty({
    description: 'User password',
    example: 'StrongPass123@',
    minLength: 6,
    pattern: '/((?=.*d)|(?=.*W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/',
  })
  @MinLength(6)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Your password is weak!',
  })
  password: string;
}
