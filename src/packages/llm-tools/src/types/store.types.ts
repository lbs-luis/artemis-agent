import type { Tool } from "./tool.types";

export interface ToolsStore {
	load(): Promise<Tool[]>;
	append(name: string, tool: Tool): Promise<void>;
}
