import { Inject, Injectable, Logger, type LoggerService } from '@nestjs/common';
import { END, START, StateGraph } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { RunnableConfig } from '@langchain/core/runnables';
import { JsonOutputParser } from '@langchain/core/output_parsers';

import { OPEN_AI_GPT_4 } from '../../openai/constants';
import { NetworkEnum } from './interfaces';
import { stateSchema, StateType } from '../schema';
import { SocialStateType } from './schema';

@Injectable()
export class PostService {
  constructor(
    @Inject(OPEN_AI_GPT_4)
    protected readonly model: ChatOpenAI,
    @Inject(Logger)
    private readonly loggerService: LoggerService,
  ) {}

  public getStateGraph() {
    const workflow = new StateGraph(stateSchema)
      .addNode('classifySocial', this.extractPostData.bind(this))
      .addNode('requestData', this.requestMissingSocialData.bind(this))
      .addNode('postAgent', this.postAgent.bind(this))
      .addConditionalEdges('classifySocial', this.checkSocialData.bind(this))
      .addEdge(START, 'classifySocial')
      .addEdge('postAgent', END);

    return workflow.compile();
  }

  public async extractPostData(state: StateType, config?: RunnableConfig) {
    this.loggerService.log('chat', state);
    const { input, social } = state;
    console.log('extractPostData', { input, social });
    const supporterNetworks = Object.values(NetworkEnum);
    const messages = [
      {
        role: 'system',
        content: `
You are an AI that extracts structured information from user input.

The user wants to make a post on a social network. Your task is to:
- Extract the post content from message
- Post content is most likely marked as a quote or is a quote
- Post content is less likely the intent to post something
- Determine which social network the user wants to post to
- List of the supported social network: ${supporterNetworks.join(', ')}.
- You have to omit field if it is not specified
- You have to omit field if it is not in the list of supported networks
- You have to omit field if it is ambiguous
- You have to omit field if you are uncertain

Respond ONLY with a JSON object in the following format:
{
  "content"?: string,
  "network"?: ${supporterNetworks.map((e) => `"${e}"`).join(' | ')}
}
      `,
      },
      { role: 'user', content: input },
    ];
    const raw = await this.model.invoke(messages);
    const result = await new JsonOutputParser<SocialStateType>().invoke(
      raw,
      config,
    );

    this.loggerService.log('extractPostData:result', social, result);
    return {
      social: Object.assign({}, social, result),
    };
  }

  public async requestMissingSocialData(
    state: StateType,
    config: RunnableConfig,
  ) {
    this.loggerService.log('requestMissingSocialData', state);
    const { social: { network = '', content = '' } = {} } = state;
    let prompt = '';
    if (!network) {
      const supporterNetworks = Object.values(NetworkEnum);
      prompt = `Ask the user which of the social networks (${supporterNetworks.join(', ')}) he wants to use`;
    }
    if (!content) {
      prompt = `Double check with user which content he wants to share`;
    }
    const stream = await this.model.stream(prompt, config);
    return {
      output: stream,
    };
  }

  public async postAgent(state: StateType, config: RunnableConfig) {
    this.loggerService.log('postAgent', state);
    const { social: { network = '' } = {} } = state;
    const prompt = `Reply that users content was successfully posted to the ${network}`;
    const stream = await this.model.stream(prompt, config);
    return {
      output: stream,
      intent: 'casual_chat',
      social: {},
    };
  }

  public async checkSocialData(state: StateType) {
    this.loggerService.log('checkSocialData', state);
    const { social: { network = '', content = '' } = {} } = state;
    if (network && content) {
      return 'postAgent';
    }
    return 'requestData';
  }
}
