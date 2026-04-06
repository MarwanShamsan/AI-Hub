import { z } from "zod";

export const commandBodySchema = z.object({
  deal_id: z.string().uuid(),
  event_type: z.string().min(1),
  payload: z.unknown()
});

export type CommandBody = z.infer<typeof commandBodySchema>;
