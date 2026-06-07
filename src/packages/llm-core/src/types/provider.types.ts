import type { ProviderEvent } from "./event.types.ts";
import type { Message } from "./message.types.ts";

export interface ToolSchema { name: string; description: string }

export type ProviderStream = (
  messages: Message[],
  options?: { tools?: ToolSchema[]; signal?: AbortSignal },
) => AsyncIterable<ProviderEvent>;
