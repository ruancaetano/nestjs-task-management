import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskStatus } from '../task-status.enum';

export class GetTaskWithFilterDto {
  @ApiProperty({
    enum: TaskStatus,
    description: 'Task status to filter',
    example: TaskStatus.DONE,
    required: false,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: string;

  @ApiProperty({
    description: 'Text to search by  task title or task description',
    example: 'Go to market',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
