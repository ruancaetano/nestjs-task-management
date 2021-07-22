import { IsEmail, Matches, MinLength } from 'class-validator';

export class AuthCredentialDto {
  @IsEmail()
  username: string;

  @MinLength(6)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Your password is weak!',
  })
  password: string;
}
