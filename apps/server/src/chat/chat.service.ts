import { Inject, Injectable, Logger, type LoggerService } from '@nestjs/common';
import { END, START, StateGraph } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { RunnableConfig } from '@langchain/core/runnables';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { RedisManager } from '@liaoliaots/nestjs-redis';
import { LangChainAdapter } from 'ai';
import { Readable } from 'stream';
import type { Response } from 'express';

import { SESSION_STORE, USER_ID } from '../app/constants';
import { OPEN_AI_GPT_4 } from '../openai/constants';
import { MessageDto } from './dto';
import { IntentEnum } from './interfaces';
import { stateSchema, StateType } from './schema';
import { PostService } from './post/post.service';

@Injectable()
export class ChatService {
  constructor(
    @Inject(OPEN_AI_GPT_4)
    protected readonly model: ChatOpenAI,
    @Inject(Logger)
    private readonly loggerService: LoggerService,
    protected readonly postService: PostService,
    private readonly redisManager: RedisManager,
  ) {}

  public async chat(
    messages: Array<InstanceType<typeof MessageDto>>,
    res: Response,
  ) {
    this.loggerService.log('chat:messages', messages);

    const client = this.redisManager.getClient(SESSION_STORE);

    // await client.del(USER_ID);
    const storedData = await client.get(USER_ID);
    const persistedState = storedData ? JSON.parse(storedData) : {};

    this.loggerService.log('chat:persistedState', persistedState);

    const app = this.getStateGraph();
    const { output, input, ...rest } = await app.invoke({
      ...persistedState,
      input: messages[messages.length - 1].content,
    });

    void input; // we dont need this

    await client.set(USER_ID, JSON.stringify(rest));

    const stream = LangChainAdapter.toDataStream(output);
    Readable.fromWeb(stream).pipe(res);
  }

  public getStateGraph() {
    const workflow = new StateGraph(stateSchema)
      .addNode('classify', this.classifyIntent.bind(this))
      .addConditionalEdges('classify', this.router.bind(this))
      .addNode('cancel', this.cancelIntent.bind(this))
      .addNode('casual', this.casualChat.bind(this))
      .addNode('post', this.postService.getStateGraph())
      .addEdge('cancel', END)
      .addEdge(START, 'classify');

    return workflow.compile();
  }

  public async classifyIntent(state: StateType, config?: RunnableConfig) {
    this.loggerService.log('classifyIntent', state);
    const { input, intent } = state;
    const supporterIntents = Object.values(IntentEnum);
    const messages = [
      {
        role: 'system',
        content: `
        Classify the user's intent as one of: ${supporterIntents.join(', ')}. 
        - You have to omit field if you are uncertain
        - You have to omit field if it is ${IntentEnum.CASUAL_CHAT}
        
        Respond ONLY with a JSON object in the following format:
        {
          "intent"?: ${supporterIntents.map((e) => `"${e}"`).join(' | ')},
        }
        `,
      },
      { role: 'user', content: input },
    ];
    const raw = await this.model.invoke(messages, config);
    const result = await new JsonOutputParser<StateType>().invoke(raw);

    this.loggerService.log('classifyIntent:result', result);
    return {
      intent: result.intent || intent || IntentEnum.CASUAL_CHAT,
    };
  }

  public async casualChat(state: StateType, config: RunnableConfig) {
    this.loggerService.log('casualChat', state);
    const stream = await this.model.stream(state.input, config);
    return {
      output: stream,
    };
  }

  public async cancelIntent(state: StateType, config: RunnableConfig) {
    this.loggerService.log('cancelIntent', state);
    const stream = await this.model.stream(state.input, config);
    return {
      output: stream,
      intent: IntentEnum.CASUAL_CHAT,
      // DEV: set all states to empty
      social: {},
    };
  }

  public async router(state: StateType) {
    this.loggerService.log('router', state);
    switch (state.intent) {
      case IntentEnum.POST_TO_SOCIAL:
        return 'post';
      case IntentEnum.CANCEL:
        return 'cancel';
      default:
      case IntentEnum.CASUAL_CHAT:
        return 'casual';
    }
  }
}
