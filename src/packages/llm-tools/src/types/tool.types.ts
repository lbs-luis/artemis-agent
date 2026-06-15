export type ToolSchema = {
	type: "object";
	properties: Record<
		string,
		{
			type: string;
			description?: string;
		}
	>;
	required?: string[];
};

export interface Tool {
	name: string;
	description: string;
	schema: ToolSchema;
	execute(
		args: Record<string, unknown>,
		signal?: AbortSignal,
	): Promise<unknown>;
}
export type ToolRegistry = Record<string, Tool>;
