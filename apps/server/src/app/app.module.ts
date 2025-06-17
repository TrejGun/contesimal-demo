import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule, RedisModuleOptions } from '@liaoliaots/nestjs-redis';
import { APP_PIPE } from '@nestjs/core';

import { ChatModule } from '../chat/chat.module';
import { AppController } from './app.controller';
import { SESSION_STORE } from './constants';
import { HttpValidationPipe } from '../pipes';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: HttpValidationPipe,
    },
  ],
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): RedisModuleOptions => {
        const redisUrl = configService.get<string>(
          'REDIS_URL',
          'redis://127.0.0.1:6379/1',
        );
        return {
          config: [
            {
              namespace: SESSION_STORE,
              url: redisUrl,
            },
          ],
        };
      },
    }),
    ChatModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
