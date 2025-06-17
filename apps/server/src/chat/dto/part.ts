import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { type IPartDto } from '../interfaces';

export class PartDto implements IPartDto {
  @ApiProperty()
  @IsString()
  public type: string;

  @ApiProperty()
  @IsString()
  public text: string;
}
