import { TestingModule, Test } from '@nestjs/testing';
import { internet, datatype, random } from 'faker';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from './task.entity';
import { User } from '../auth/user.entity';
import { TaskStatus } from './task-status.enum';
import { GetTaskWithFilterDto } from './dto/get-task-with-filter.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskRepository } from './task.repository';

describe('Tasks service', () => {
  let tasksService: TasksService;
  let tasksRepository: TaskRepository;

  const mockedUser = {
    id: datatype.uuid(),
    username: internet.email(),
    password: `hashed_${internet.password(8)}`,
  };

  const mockedTasks: Task[] = [
    {
      id: datatype.uuid(),
      title: datatype.string(10),
      description: datatype.string(20),
      status: TaskStatus.OPEN,
      user: mockedUser as User,
    },
    {
      id: datatype.uuid(),
      title: datatype.string(10),
      description: datatype.string(20),
      status: TaskStatus.DONE,
      user: mockedUser as User,
    },
    {
      id: datatype.uuid(),
      title: datatype.string(10),
      description: datatype.string(20),
      status: TaskStatus.OPEN,
      user: null,
    },
  ];

  const mockedTaskRepository = {
    getTasks: jest.fn(async (filterDto: GetTaskWithFilterDto, user: User) => {
      return mockedTasks.filter((task) => {
        return (
          task.user?.id === user.id &&
          (!filterDto.search ||
            task.title.includes(filterDto.search) ||
            task.description.includes(filterDto.search)) &&
          (!filterDto.status || filterDto.status === task.status)
        );
      });
    }),
    findOne: jest.fn(({ id, user }) => {
      return new Promise((resolve, reject) => {
        const foundTask = mockedTasks.find((task) => {
          return task.user?.id === user.id && task.id === id;
        });

        if (foundTask) {
          resolve(foundTask);
        }

        reject(new NotFoundException());
      });
    }),
    createTask: jest.fn((dto: CreateTaskDto, user: User) => {
      return Promise.resolve({
        ...dto,
        id: datatype.uuid(),
        status: TaskStatus.OPEN,
        user,
      });
    }),
    save: jest.fn((task) => task),
    remove: jest.fn(async (tasks) => tasks),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: TaskRepository,
          useValue: mockedTaskRepository,
        },
      ],
    }).compile();

    tasksService = module.get<TasksService>(TasksService);
    tasksRepository = module.get<TaskRepository>(TaskRepository);
  });

  it('should be defined', () => {
    expect(tasksService).toBeDefined();
  });

  describe('list tasks', () => {
    it('should list all user tasks', async () => {
      const filter = {};
      const response = await tasksService.getTasks(filter, mockedUser as User);
      expect(response).toEqual([mockedTasks[0], mockedTasks[1]]);
      expect(tasksRepository.getTasks).toBeCalledWith(
        filter,
        mockedUser as User,
      );
    });
  });

  describe('Search with filters', () => {
    it('should list user tasks filtering by title part', async () => {
      const filter = {
        search: mockedTasks[0].title.slice(0, 5),
      };
      const response = await tasksService.getTasks(filter, mockedUser as User);
      expect(response).toEqual([mockedTasks[0]]);
      expect(tasksRepository.getTasks).toBeCalledWith(
        filter,
        mockedUser as User,
      );
    });

    it('should list user tasks filtering by description part', async () => {
      const filter = {
        search: mockedTasks[0].description.slice(0, 10),
      };
      const response = await tasksService.getTasks(filter, mockedUser as User);
      expect(response).toEqual([mockedTasks[0]]);
      expect(tasksRepository.getTasks).toBeCalledWith(
        filter,
        mockedUser as User,
      );
    });

    it('should list user tasks filtering by status', async () => {
      const filter = {
        status: TaskStatus.DONE,
      };
      const response = await tasksService.getTasks(filter, mockedUser as User);
      expect(response).toEqual([mockedTasks[1]]);
      expect(tasksRepository.getTasks).toBeCalledWith(
        filter,
        mockedUser as User,
      );
    });
  });

  describe('Get one by id', () => {
    it('should return user task by id', async () => {
      const response = await tasksService.getTaskById(
        mockedTasks[0].id,
        mockedUser as User,
      );

      expect(response).toEqual(mockedTasks[0]);
    });

    it('should throws not found error if task not found', async () => {
      try {
        await tasksService.getTaskById('invalidId', mockedUser as User);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  });

  describe('Creation', () => {
    it('should create new user task', async () => {
      const mockDto = {
        title: datatype.string(10),
        description: datatype.string(20),
      };

      const response = await tasksService.createTask(
        mockDto,
        mockedUser as User,
      );

      expect(response).toEqual({
        ...mockDto,
        id: expect.any(String),
        status: TaskStatus.OPEN,
        user: mockedUser,
      });

      expect(tasksRepository.createTask).toHaveBeenCalledWith(
        mockDto,
        mockedUser as User,
      );
    });
  });

  describe('Updating', () => {
    it('should update task status', async () => {
      const randomStatus = random.arrayElement([
        TaskStatus.OPEN,
        TaskStatus.IN_PROGRESS,
        TaskStatus.DONE,
      ]);
      const response = await tasksService.updateTaskStatus(
        mockedTasks[0].id,
        {
          status: randomStatus,
        },
        mockedUser as User,
      );

      expect(response).toEqual({
        ...mockedTasks[0],
        status: randomStatus,
      });
    });

    it('should throw not found if tasks not exists', async () => {
      try {
        await tasksService.updateTaskStatus(
          'invalidId',
          {
            status: TaskStatus.DONE,
          },
          mockedUser as User,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  });

  describe('Deleting', () => {
    it('should remove a user task', async () => {
      await tasksService.deleteTask(mockedTasks[0].id, mockedUser as User);
    });

    it('should throws not found if a user task not exists', async () => {
      try {
        await tasksService.deleteTask('invalidId', mockedUser as User);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  });
});
