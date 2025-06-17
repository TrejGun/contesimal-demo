import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { type IMessageDto, Roles } from '../interfaces';
import { PartDto } from './part';

export class MessageDto implements IMessageDto {
  @ApiProperty()
  @IsString()
  public content: string;

  @ApiProperty()
  @IsEnum(Roles)
  public role: Roles;

  @ApiProperty({
    type: PartDto,
  })
  @ValidateNested()
  @Type(() => PartDto)
  public parts: Array<InstanceType<typeof PartDto>>;
}
