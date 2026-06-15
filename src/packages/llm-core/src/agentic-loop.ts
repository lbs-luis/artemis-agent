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
	tools?: ToolRegistry;
	signal?: AbortSignal;
	onEvent?: (event: AgentEvent) => void;
}

export async function agentLoop(
	messages: Message[],
	opts: RunOptions,
): Promise<string> {
	const { provider, tools = {}, signal, onEvent } = opts;

	while (true) {
		if (signal?.aborted) throw new Error("aborted");

		const assistant = await assembleAssistant(
			provider,
			messages,
			tools,
			signal,
			onEvent,
		);
		messages.push(assistant);
		onEvent?.({ type: "turn_end" });

		// ReAct STOP condition: the model stopped asking for tools.
		if (assistant.toolCalls.length === 0) {
			onEvent?.({ type: "done", answer: assistant.content });
			return assistant.content;
		}

		for (const call of assistant.toolCalls) {
			if (signal?.aborted) throw new Error("aborted");
			const result = await runTool(tools, call, signal);
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
	tools: ToolRegistry,
	signal: AbortSignal | undefined,
	onEvent: ((e: AgentEvent) => void) | undefined,
): Promise<Extract<Message, { role: "assistant" }>> {
	let content = "";
	const toolCalls: ToolCall[] = [];
	let stopReason: StopReason = "stop";

	const toolSchemas = Object.entries(tools).map(([name, t]) => ({
		name,
		description: t.description,
	}));

	console.log("[assembleAssistant]: Tools: ", JSON.stringify(toolSchemas));

	for await (const event of provider(messages, {
		tools: toolSchemas,
		signal,
	})) {
		if (event.type === "delta") {
			content += event.text;
			onEvent?.({ type: "text", text: event.text });
		} else if (event.type === "tool_call") {
			const toolCall = { id: event.id, name: event.name, args: event.args };
			toolCalls.push(toolCall);
			console.log("[assembleAssistant]: ToolCall: ", JSON.stringify(toolCall));
			onEvent?.({ type: "tool_start", name: event.name, args: event.args });
		} else if (event.type === "done") stopReason = event.stopReason;
		else throw new Error(event.message); // error event
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
		if (!tool) throw new Error(`unknown tool: ${call.name}`);
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
