import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';

import { ChatDto } from './dto';
import { ChatService } from './chat.service';

@Controller('/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('/')
  public async chat(
    @Body() { messages }: ChatDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.chatService.chat(messages, res);
  }
}
