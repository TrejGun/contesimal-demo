import { ApiProperty } from '@nestjs/swagger';
import { IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { IChatDto } from '../interfaces';
import { MessageDto } from './message';

export class ChatDto implements IChatDto {
  @ApiProperty()
  @IsString()
  public id: string;

  @ApiProperty({
    type: MessageDto,
  })
  @ValidateNested()
  @Type(() => MessageDto)
  public messages: Array<InstanceType<typeof MessageDto>>;
}
