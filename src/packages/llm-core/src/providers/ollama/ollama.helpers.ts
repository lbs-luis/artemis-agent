import type { Tool } from "@artemis/llm-tools/types";

export function toOllamaTools(tools: Tool[]) {
	return tools.map((tool) => ({
		type: "function" as const,
		function: {
			name: tool.name,
			description: tool.description,
			parameters: tool.schema,
		},
	}));
}
