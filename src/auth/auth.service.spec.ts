import { TestingModule, Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { internet, datatype } from 'faker';
import { AuthCredentialDto } from './dto/auth-credential.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { JwtService } from '@nestjs/jwt';
import { User } from './user.entity';

jest
  .spyOn(bcrypt, 'compare')
  .mockImplementation((password: string, hashedPassword: string) => {
    return `hashed_${password}` === hashedPassword;
  });

describe('Auth Service', () => {
  let authService: AuthService;
  let userRepository: UserRepository;

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

  const mockedJwtService = {
    sign: jest.fn(() => {
      return Promise.resolve({
        accessToken: 'token',
      });
    }),
  };

  const mockedUserRepository = {
    createUser: jest.fn(async (dto: AuthCredentialDto) => {
      return new Promise((resolve, reject) => {
        const foundUser = mockedUsers.find(
          (user) => user.username === dto.username,
        );

        if (foundUser) {
          reject(new ConflictException('Username already exists'));
        }

        resolve({
          ...dto,
          password: `hashed_${dto.password}`,
          id: datatype.uuid(),
        });
      });
    }),
    save: jest.fn((user: User) => user),
    findOne: jest.fn(async ({ username }) => {
      return mockedUsers.find((mock) => mock.username === username);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: mockedUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockedJwtService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(userRepository).toBeDefined();
  });

  it('should returns created user', async () => {
    const response = await authService.singUp(mockedCredential);
    expect(response.id).toBeDefined();
    expect(
      await bcrypt.compare(mockedCredential.password, response.password),
    ).toBeTruthy();
    expect(userRepository.createUser).toBeCalledWith(mockedCredential);
  });
  it('should throws conflictException if username already exists', async () => {
    try {
      await authService.singUp(mockedUsers[0]);
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
    }
  });

  it('should return access token for valid user', async () => {
    const response = await authService.singIn({
      username: mockedUsers[0].username,
      password: mockedUsers[0].password.replace('hashed_', ''),
    });
    expect(response.accessToken).toBeDefined();
  });

  it('should throw unauthorizedException for invalid user', async () => {
    try {
      await authService.singIn({
        username: 'invalid',
        password: 'invalid',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
    }
  });
});
