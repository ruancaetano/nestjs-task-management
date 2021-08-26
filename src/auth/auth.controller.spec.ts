import { TestingModule, Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { internet, datatype, random } from 'faker';
import { AuthCredentialDto } from './dto/auth-credential.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('Auth controller', () => {
  let authController: AuthController;

  const mockedCredential = {
    username: internet.email(),
    password: internet.password(8),
  };

  const mockedUsers = [
    {
      id: datatype.uuid(),
      username: internet.email(),
      password: `hashed_${internet.password(8)}`,
    },
  ];

  const mockedAuthService = {
    singUp: jest.fn((dto: AuthCredentialDto) => {
      return new Promise((resolve, reject) => {
        const foundUser = mockedUsers.find(
          (user) => user.username === dto.username,
        );

        if (foundUser) {
          reject(new ConflictException('Username already exists'));
        }

        resolve({
          ...dto,
          id: datatype.uuid(),
        });
      });
    }),
    singIn: jest.fn((dto: AuthCredentialDto) => {
      return new Promise((resolve, reject) => {
        const found = mockedUsers.find((mock) => {
          return (
            mock.username === dto.username &&
            mock.password === `rashed_${dto.password}`
          );
        });

        if (!found) {
          reject(new UnauthorizedException('Please check your credentials'));
        }

        resolve({
          accessToken: 'token',
        });
      });
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    })
      .overrideProvider(AuthService)
      .useValue(mockedAuthService)
      .compile();

    authController = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  it('should create user', async () => {
    const response = await authController.singUp(mockedCredential);

    expect(response).toEqual({
      ...mockedCredential,
      id: expect.any(String),
    });
    expect(mockedAuthService.singUp).toBeCalledWith(mockedCredential);
  });

  it('should throws conflictException if username already exists', async () => {
    try {
      await authController.singUp(mockedUsers[0]);
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
    }
  });

  it('should return access token for valid user', async () => {
    const response = await authController.singIn(mockedUsers[0]);
    expect(response.accessToken).toBeDefined();
    expect(mockedAuthService.singIn).toBeCalledWith(mockedUsers[0]);
  });

  it('should throws unauthorizedException for invalid user', async () => {
    try {
      await authController.singIn({
        username: 'invalid',
        password: 'invalid',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
    }
  });
});
