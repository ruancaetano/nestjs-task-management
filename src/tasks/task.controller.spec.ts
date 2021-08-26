import { TestingModule, Test } from '@nestjs/testing';
import { internet, datatype, random } from 'faker';
import { NotFoundException } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './task.entity';
import { User } from '../auth/user.entity';
import { TaskStatus } from './task-status.enum';
import { GetTaskWithFilterDto } from './dto/get-task-with-filter.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';

describe('Tasks controller', () => {
  let tasksController: TasksController;
  let tasksService: TasksService;

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

  const mockedTaskService = {
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
    getTaskById: jest.fn((taskId: string, user: User) => {
      return new Promise((resolve, reject) => {
        const foundTask = mockedTasks.find((task) => {
          return task.user?.id === user.id && task.id === taskId;
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
    updateTaskStatus: jest.fn(
      async (
        taskId: string,
        updateTaskStatusDto: UpdateTaskStatusDto,
        user: User,
      ) => {
        const task = await mockedTaskService.getTaskById(taskId, user);

        return {
          ...task,
          status: updateTaskStatusDto.status,
        };
      },
    ),
    deleteTask: jest.fn(async (taskId, user) => {
      await mockedTaskService.getTaskById(taskId, user);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockedTaskService,
        },
      ],
    }).compile();

    tasksController = module.get<TasksController>(TasksController);
    tasksService = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(tasksController).toBeDefined();
  });

  describe('list tasks', () => {
    it('should list all user tasks', async () => {
      const filter = {};
      const response = await tasksController.getTasks(
        filter,
        mockedUser as User,
      );
      expect(response).toEqual([mockedTasks[0], mockedTasks[1]]);
      expect(tasksService.getTasks).toBeCalledWith(filter, mockedUser as User);
    });
  });

  describe('Search with filters', () => {
    it('should list user tasks filtering by title part', async () => {
      const filter = {
        search: mockedTasks[0].title.slice(0, 5),
      };
      const response = await tasksController.getTasks(
        filter,
        mockedUser as User,
      );
      expect(response).toEqual([mockedTasks[0]]);
      expect(tasksService.getTasks).toBeCalledWith(filter, mockedUser as User);
    });

    it('should list user tasks filtering by description part', async () => {
      const filter = {
        search: mockedTasks[0].description.slice(0, 10),
      };
      const response = await tasksController.getTasks(
        filter,
        mockedUser as User,
      );
      expect(response).toEqual([mockedTasks[0]]);
      expect(tasksService.getTasks).toBeCalledWith(filter, mockedUser as User);
    });

    it('should list user tasks filtering by status', async () => {
      const filter = {
        status: TaskStatus.DONE,
      };
      const response = await tasksController.getTasks(
        filter,
        mockedUser as User,
      );
      expect(response).toEqual([mockedTasks[1]]);
      expect(tasksService.getTasks).toBeCalledWith(filter, mockedUser as User);
    });
  });

  describe('Get one by id', () => {
    it('should return user task by id', async () => {
      const response = await tasksController.getTaskById(
        mockedTasks[0].id,
        mockedUser as User,
      );

      expect(response).toEqual(mockedTasks[0]);
      expect(tasksService.getTaskById).toHaveBeenCalledWith(
        mockedTasks[0].id,
        mockedUser as User,
      );
    });

    it('should throws not found error if task not found', async () => {
      try {
        await tasksController.getTaskById('invalidId', mockedUser as User);
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

      const response = await tasksController.createTask(
        mockDto,
        mockedUser as User,
      );

      expect(response).toEqual({
        ...mockDto,
        id: expect.any(String),
        status: TaskStatus.OPEN,
        user: mockedUser,
      });

      expect(tasksService.createTask).toHaveBeenCalledWith(
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
      const response = await tasksController.updateTaskStatus(
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

      expect(tasksService.updateTaskStatus).toHaveBeenCalledWith(
        mockedTasks[0].id,
        {
          status: randomStatus,
        },
        mockedUser as User,
      );
    });

    it('should throw not found if tasks not exists', async () => {
      try {
        await tasksController.updateTaskStatus(
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
      await tasksController.deleteTask(mockedTasks[0].id, mockedUser as User);

      expect(tasksService.deleteTask).toHaveBeenCalledWith(
        mockedTasks[0].id,
        mockedUser as User,
      );
    });

    it('should throws not found if a user task not exists', async () => {
      try {
        await tasksController.deleteTask('invalidId', mockedUser as User);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(tasksService.deleteTask).toHaveBeenCalledWith(
          'invalidId',
          mockedUser as User,
        );
      }
    });
  });
});
