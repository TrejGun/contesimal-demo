import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { openAiProvider } from '../../openai/provider';
import { PostService } from './post.service';

@Module({
  imports: [ConfigModule],
  providers: [openAiProvider, Logger, PostService],
  exports: [PostService],
})
export class PostIntentModule {}
