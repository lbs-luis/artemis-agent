import type { StopReason } from "./message.types.ts";

// PROVIDER → loop: the "agent communication stream" (toy AssistantMessageEvent).
export type ProviderEvent =
	| { type: "delta"; text: string }
	| {
			type: "tool_call";
			id: string;
			name: string;
			args: Record<string, unknown>;
	  }
	| { type: "done"; stopReason: StopReason }
	| { type: "error"; message: string };

// LOOP → UI: lifecycle events that render the "rounds".
export type AgentEvent =
	| { type: "text"; text: string }
	| { type: "tool_start"; name: string; args: Record<string, unknown> }
	| { type: "tool_end"; name: string; content: string; isError: boolean }
	| { type: "turn_end" }
	| { type: "done"; answer: string }
	| { type: "error"; message: string };
