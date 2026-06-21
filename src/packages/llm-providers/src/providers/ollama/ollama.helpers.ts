import type { Message } from "@artemis/llm-core";
import type { Tool } from "@artemis/llm-tools/types";

export function toOllamaTools(tools: Tool[]) {
	const convertedTools = tools.map((tool) => ({
		type: "function" as const,
		function: {
			name: tool.name,
			description: tool.description,
			parameters: tool.schema,
		},
	}));

	return convertedTools;
}

export function toOllamaMessages(messages: Message[]) {
	return messages.map((message) => {
		if (message.role === "assistant")
			return {
				role: "assistant",
				content: message.content,
				...(message.toolCalls.length > 0 && {
					tool_calls: message.toolCalls.map((tc) => ({
						function: { name: tc.name, arguments: tc.args },
					})),
				}),
			};
		if (message.role === "tool")
			return {
				role: "tool",
				tool_name: message.toolName,
				content: message.content,
			};
		return { role: "user", content: message.content };
	});
}
