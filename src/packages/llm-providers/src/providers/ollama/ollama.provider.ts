import type { ProviderEvent, ProviderStream } from "@artemis/llm-core";
import llmTools from "@artemis/llm-tools";
import { toOllamaMessages, toOllamaTools } from "./ollama.helpers";

export interface OllamaConfig {
	baseUrl?: string;
	model: string;
}

export function createOllamaProvider(config: OllamaConfig): ProviderStream {
	const baseUrl = config.baseUrl ?? "http://localhost:11434";

	return async function* (messages, options) {
		const response = await fetch(`${baseUrl}/api/chat`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model: config.model,
				messages: toOllamaMessages(messages),
				tools: toOllamaTools(await llmTools.load()),
				stream: true,
				think: false,
			}),
			signal: options?.signal, // cancellation threads through
		});

		if (!response.ok || !response.body) {
			yield {
				type: "error",
				message: `Ollama ${response.status}: ${await response.text()}`,
			};
			return;
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = "";

		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });

			while (true) {
				const newline = buffer.indexOf("\n");
				if (newline === -1) break;
				const line = buffer.slice(0, newline).trim();
				buffer = buffer.slice(newline + 1);
				if (!line) continue;

				const json = JSON.parse(line) as {
					message?: {
						content?: string;
						tool_calls?: {
							id: string;
							function: { name: string; arguments: Record<string, unknown> };
						}[];
					};
					done?: boolean;
				};
				const token = json.message?.content;

				if (token) yield { type: "delta", text: token } satisfies ProviderEvent;

				for (const call of json.message?.tool_calls ?? []) {
					yield {
						type: "tool_call",
						id: call.id ?? crypto.randomUUID(),
						name: call.function.name,
						args: call.function.arguments ?? {},
					} satisfies ProviderEvent;
				}

				if (json.done) {
					yield { type: "done", stopReason: "stop" } satisfies ProviderEvent;
					return;
				}
			}
		}
	};
}
