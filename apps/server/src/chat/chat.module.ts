import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { openAiProvider } from '../openai/provider';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PostIntentModule } from './post/post.module';

@Module({
  imports: [ConfigModule, PostIntentModule],
  providers: [openAiProvider, Logger, ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
