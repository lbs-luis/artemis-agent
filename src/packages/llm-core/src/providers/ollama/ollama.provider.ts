import type { ProviderEvent, ProviderStream, Tool } from "@artemis/llm-core";
import { toOllamaTools } from "./ollama.helpers";

export interface OllamaConfig {
	baseUrl?: string;
	model: string;
	tools: Tool[];
}

export function createOllamaProvider(config: OllamaConfig): ProviderStream {
	const baseUrl = config.baseUrl ?? "http://localhost:11434";

	return async function* (messages, options) {
		const response = await fetch(`${baseUrl}/api/chat`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model: config.model,
				messages,
				tools: toOllamaTools(config.tools),
				stream: true,
				think: true,
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
				const newline = buffer.indexOf("\n"); // ← recomputed each pass (the fixed loop)
				if (newline === -1) break;
				const line = buffer.slice(0, newline).trim();
				buffer = buffer.slice(newline + 1);
				if (!line) continue;

				const json = JSON.parse(line) as {
					message?: { content?: string };
					done?: boolean;
				};
				const token = json.message?.content;
				if (token) yield { type: "delta", text: token } satisfies ProviderEvent;
				if (json.done) {
					yield { type: "done", stopReason: "stop" } satisfies ProviderEvent;
					return;
				}
			}
		}
	};
}
