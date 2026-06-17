import type { ProviderEvent } from "./event.types.ts";
import type { Message } from "./message.types.ts";

export type ProviderStream = (
	messages: Message[],
	options?: { signal?: AbortSignal },
) => AsyncIterable<ProviderEvent>;
