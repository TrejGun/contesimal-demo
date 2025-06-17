import { z } from 'zod';
import { NetworkEnum } from '../interfaces';

export const socialStateSchema = z.object({
  network: z.nativeEnum(NetworkEnum).optional(),
  content: z.string().optional(),
});

export type SocialStateType = z.infer<typeof socialStateSchema>;
