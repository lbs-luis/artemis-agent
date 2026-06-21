export type StopReason = "stop" | "toolUse" | "error" | "aborted";

export interface ToolCall {
	id: string;
	name: string;
	args: Record<string, unknown>;
}

export type Message =
	| { role: "user"; content: string }
	| {
			role: "assistant";
			content: string;
			toolCalls: ToolCall[];
			stopReason: StopReason;
	  }
	| {
			role: "tool";
			toolCallId: string;
			toolName: string;
			content: string;
			isError: boolean;
	  };
