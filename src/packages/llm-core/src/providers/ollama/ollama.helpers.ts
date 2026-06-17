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

	// console.log("[OllamaProvider][Helper]: tools", convertedTools);
	return convertedTools;
}
