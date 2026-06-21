export type ToolSchema = {
	type: string; // should be 'object' always
	properties: Record<
		string,
		{
			type: string;
			description?: string;
		}
	>;
	required?: string[];
};

export type ToolExecute = (
	args: Record<string, unknown>,
	signal?: AbortSignal,
) => Promise<unknown>;

export interface Tool {
	name: string;
	description: string;
	schema: ToolSchema;
	execute: ToolExecute;
}
export type ToolRegistry = Record<string, ToolExecute>;
