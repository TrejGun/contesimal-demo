import { ConfigService } from '@nestjs/config';

import { ChatOpenAI } from '@langchain/openai';
import { OPEN_AI_GPT_4 } from './constants';

export const openAiProvider = {
  provide: OPEN_AI_GPT_4,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const apiKey = configService.get<string>('OPENAI_API_KEY', '');
    return new ChatOpenAI({
      model: 'gpt-4',
      apiKey,
    });
  },
};
