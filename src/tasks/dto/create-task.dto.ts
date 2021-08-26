import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @IsNotEmpty()
  @ApiProperty({
    description: 'Task title/name',
    example: 'Go to the market',
  })
  title: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Task description',
    example: 'Go to the market to buy fruits',
  })
  description: string;
}
