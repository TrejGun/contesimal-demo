import { Roles } from './roles';
import { IPartDto } from './part';

export interface IMessageDto {
  content: string;
  role: Roles;
  parts: Array<IPartDto>;
}
