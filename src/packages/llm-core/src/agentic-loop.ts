import llmTools from "@artemis/llm-tools";
import { saveLog } from "@artemis/logs";
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
			return;
		}

		for (const call of assistant.toolCalls) {
			if (signal?.aborted) throw new Error("aborted");

			const tools = (await llmTools.load()).reduce<ToolRegistry>(
				(toolsRecord, tool) => {
					toolsRecord[tool.name] = tool.execute;
					return toolsRecord;
				},
				{},
			);

			const result = await runTool(tools, call, signal);

			onEvent?.({
				type: "tool_end",
				name: call.name,
				content: result.content,
				isError: result.isError,
			});

			messages.push(result);

			saveLog({ description: "agentic-loop/tool_call", content: call.name });
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
				console.log(`[agenticLoop][assembleAssistant]: ${event.name}`);
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
	const { args: toolArgs, id: toolCallId, name: toolName } = call;

	const toolExecuteFunction = tools[call.name];

	const toolEvent: Extract<Message, { role: "tool" }> = {
		role: "tool",
		toolCallId,
		toolName,
		content: "",
		isError: false,
	};

	function setToolErrorEvent(error: string) {
		toolEvent.isError = true;
		toolEvent.content = error;
	}

	try {
		if (!toolExecuteFunction) {
			setToolErrorEvent(`Error: Tool not found - ${toolName}`);
			return toolEvent;
		}

		const result = await toolExecuteFunction(toolArgs, signal);

		toolEvent.content = JSON.stringify(result);

		return toolEvent;
	} catch (err) {
		setToolErrorEvent(err instanceof Error ? err.message : String(err));
		return toolEvent;
	}
}
