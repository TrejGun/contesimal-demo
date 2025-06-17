import { IMessageDto } from './message';

export interface IChatDto {
  id: string;
  messages: Array<IMessageDto>;
}
