import { z } from 'zod';
import { IntentEnum } from '../interfaces';
import { socialStateSchema } from '../post/schema';

export const stateSchema = z.object({
  input: z.string(),
  output: z.any().optional(),
  intent: z.nativeEnum(IntentEnum).optional(),
  social: socialStateSchema.optional(),
});

export type StateType = z.infer<typeof stateSchema>;
