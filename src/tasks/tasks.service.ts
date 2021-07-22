import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../auth/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTaskWithFilterDto } from './dto/get-task-with-filter.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { Task } from './task.entity';
import { TaskRepository } from './task.repository';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskRepository)
    private taskRepository: TaskRepository,
  ) {}

  public getTasks(
    filterDto: GetTaskWithFilterDto,
    user: User,
  ): Promise<Task[]> {
    return this.taskRepository.getTasks(filterDto, user);
  }

  async getTaskById(taskId: string, user: User): Promise<Task> {
    const foundTask = await this.taskRepository.findOne({ id: taskId, user });

    if (!foundTask) {
      throw new NotFoundException();
    }
    return foundTask;
  }

  async deleteTask(taskId: string, user: User): Promise<void> {
    const foundTask = await this.getTaskById(taskId, user);
    this.taskRepository.remove([foundTask]);
  }

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    return this.taskRepository.createTask(createTaskDto, user);
  }

  async updateTaskStatus(
    taskId: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
    user: User,
  ): Promise<Task> {
    const { status } = updateTaskStatusDto;
    const foundTask = await this.getTaskById(taskId, user);
    foundTask.status = status;
    return this.taskRepository.save(foundTask);
  }
}
