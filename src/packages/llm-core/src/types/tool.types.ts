export interface Tool {
  description: string;
  execute(args: Record<string, unknown>, signal?: AbortSignal): Promise<unknown>;
}
export type ToolRegistry = Record<string, Tool>;
