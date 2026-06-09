import {
	agentLoop,
	type Message,
	type ProviderStream,
} from "@artemis/llm-core";
import type { SessionStore } from "@artemis/session-store";
import { useCallback, useRef, useState } from "react";

interface Props {
	provider: ProviderStream;
	store: SessionStore;
	sessionId: string;
	initial: Message[];
}

interface UIMessage {
	role: "user" | "assistant";
	content: string;
}

export function ChatScreen({ initial, provider, sessionId, store }: Props) {
	const [busy, setBusy] = useState<boolean>(false);
	const [prompt, setPrompt] = useState<string>("");
	const session = useRef<Message[]>(initial);
	const [chat, setChat] = useState<UIMessage[]>(
		initial
			.filter(
				(m): m is Extract<Message, { role: "user" | "assistant" }> =>
					m.role !== "tool",
			)
			.map((m) => ({ role: m.role, content: m.content })),
	);

	const handleSendPrompt = useCallback(async () => {
		if (prompt.trim().length === 0) return;
		setBusy(true);

		session.current.push({ role: "user", content: prompt });
		setPrompt("");

		let is_model_message_in_chat = false;

		await agentLoop(session.current, {
			provider,
			onEvent(event) {
				const { type } = event;
				if (type === "text")
					setChat((messages) => {
						if (!is_model_message_in_chat) {
							is_model_message_in_chat = true;
							return [...messages, { role: "assistant", content: event.text }];
						}
						const model_message = messages[messages.length - 1];
						messages[messages.length - 1] = {
							...model_message,
							content: model_message.content + event.text,
						};
						return [...messages];
					});
				else if (event.type === "tool_start")
					console.log(`[${event.name}]`, event.args);
				else if (event.type === "tool_end")
					console.log(`${event.name}]`, event.content);
				else if (event.type === "turn_end") console.log("turn_end", "...");
				else if (event.type === "done") console.log("[agentLoop]: ", "done");
				else if (event.type === "error")
					console.error("\nERROR:", event.message);
			},
		});

		await store.append(sessionId, session.current);
		setBusy(false);
	}, [prompt, provider, sessionId, store]);

	return (
		<box style={{ flexDirection: "column", flexGrow: 1 }}>
			<scrollbox
				style={{ flexGrow: 1 }}
				contentOptions={{ flexDirection: "column", gap: 1 }}
				scrollX={false}
				stickyScroll
				stickyStart="bottom"
			>
				{chat.map((message, i) => (
					<text key={`${sessionId}-${i}`}>{message.content}</text>
				))}
				{busy && <text fg="#fbbf24">artemis is thinking…</text>}
			</scrollbox>

			<box style={{ borderStyle: "rounded", paddingX: 1, paddingBottom: 1 }}>
				<input
					onSubmit={handleSendPrompt}
					value={prompt}
					onInput={setPrompt}
					placeholder="Prompt..."
					focused
				/>
			</box>
		</box>
	);
}
