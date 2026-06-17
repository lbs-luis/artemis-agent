import type {
	AgentEvent,
	Message,
	ProviderStream,
	StopReason,
	ToolCall,
	ToolRegistry,
} from "./types/index.ts";

export interface RunOptions {
	provider: ProviderStream;
	onEvent?: (event: AgentEvent) => void;
	signal?: AbortSignal;
}

export async function agentLoop(
	messages: Message[],
	opts: RunOptions,
): Promise<void> {
	const { provider, signal, onEvent } = opts;

	while (true) {
		if (signal?.aborted) throw new Error("aborted");

		const assistant = await assembleAssistant(
			provider,
			messages,
			onEvent,
			signal,
		);

		messages.push(assistant);

		onEvent?.({ type: "turn_end" });

		if (assistant.toolCalls.length === 0) {
			onEvent?.({ type: "done", answer: assistant.content });
		}

		for (const call of assistant.toolCalls) {
			if (signal?.aborted) throw new Error("aborted");

			const result = await runTool({}, call, signal);
			onEvent?.({
				type: "tool_end",
				name: call.name,
				content: result.content,
				isError: result.isError,
			});
			messages.push(result);
		}
	}
}

async function assembleAssistant(
	provider: ProviderStream,
	messages: Message[],
	onEvent: ((e: AgentEvent) => void) | undefined,
	signal: AbortSignal | undefined,
): Promise<Extract<Message, { role: "assistant" }>> {
	let content = "";
	const toolCalls: ToolCall[] = [];
	let stopReason: StopReason = "stop";

	for await (const event of provider(messages, {
		signal,
	})) {
		const { type } = event;
		switch (type) {
			case "delta": {
				content += event.text;
				onEvent?.({ type: "text", text: event.text });
				break;
			}
			case "tool_call": {
				const toolCall = { id: event.id, name: event.name, args: event.args };
				toolCalls.push(toolCall);
				console.log(
					"[assembleAssistant]: ToolCall: ",
					JSON.stringify(toolCall),
				);
				onEvent?.({ type: "tool_start", name: event.name, args: event.args });
				break;
			}
			case "done": {
				stopReason = event.stopReason;
				break;
			}
			default: {
				throw new Error(event.message);
			}
		}
	}

	return { role: "assistant", content, toolCalls, stopReason };
}

async function runTool(
	tools: ToolRegistry,
	call: ToolCall,
	signal: AbortSignal | undefined,
): Promise<Extract<Message, { role: "tool" }>> {
	const tool = tools[call.name];
	try {
		if (!tool) {
			return {
				role: "tool",
				toolCallId: call.id,
				content: "Error: Tool not exists",
				isError: true,
			};
		}
		const result = await tool.execute(call.args, signal);
		return {
			role: "tool",
			toolCallId: call.id,
			content: JSON.stringify(result),
			isError: false,
		};
	} catch (err) {
		return {
			role: "tool",
			toolCallId: call.id,
			content: err instanceof Error ? err.message : String(err),
			isError: true,
		};
	}
}
