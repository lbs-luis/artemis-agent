import type { Message } from "@artemis/llm-core";

export interface SessionStore {
	load(sessionId: string): Promise<Message[]>;
	append(sessionId: string, messages: Message[]): Promise<void>;
}
