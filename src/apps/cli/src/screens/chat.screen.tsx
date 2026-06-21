import {
	agentLoop,
	type Message,
	type ProviderStream,
	type ToolRegistry,
} from "@artemis/llm-core";

import { useCallback, useRef, useState } from "react";

interface Props {
	provider: ProviderStream;
	session: {
		chat: Message[];
		update(message: Message): Promise<void>;
	};
	tools: ToolRegistry;
}

export function ChatScreen({ provider, session, tools }: Props) {
	const [busy, setBusy] = useState<boolean>(false);
	const [prompt, setPrompt] = useState<string>("");
	const [chat, setChat] = useState<Message[]>(session.chat);
	const liveChat = useRef<Message[]>(session.chat);

	const updateChat = useCallback(({ message, clearPrompt, updateSession, updateLiveChat }: { message: Message, clearPrompt?: boolean, updateLiveChat?: boolean, updateSession?: boolean }) => {
		setChat((prev) => [...prev, message]);

		if (updateLiveChat) liveChat.current.push(message);
		if (updateSession) session.update(message);
		if (clearPrompt) setPrompt("");
	}, [session])

	const syncChat = useCallback(() => {
		const lastUiMessage = chat[chat.length - 1]

		liveChat.current.push(lastUiMessage)
		session.update(lastUiMessage)
	}, [chat, session])

	const handleSendPrompt = useCallback(async () => {
		if (prompt.trim().length === 0) return;
		setBusy(true);

		// update both chats and let node asynchronous update the session file
		updateChat({ message: { role: "user", content: prompt }, clearPrompt: true, updateSession: true, updateLiveChat: true })

		let is_model_message_in_chat = false;

		await agentLoop(liveChat.current, {
			provider,
			async onEvent(event) {
				const { type } = event;
				switch (type) {
					case "text": {
						if (!is_model_message_in_chat) {
							updateChat({
								message: {
									role: "assistant",
									content: event.text,
									toolCalls: [],
									stopReason: "stop",
								},
							})
							is_model_message_in_chat = true;
							break;
						}

						setChat((prev) => {
							prev[prev.length - 1].content += event.text;
							return [...prev];
						});
						break;
					}
					case "done": {
						console.log("[TUI]: Done");
						if (is_model_message_in_chat) syncChat();
						break;
					}
					case "tool_start": {
						console.log("[TUI]: tool_start");
						console.log(`[TUI]:[tool_start]: ${liveChat.current[liveChat.current.length - 1].role}`)
						break;
					}
					case "tool_end": {
						console.log("[TUI]: tool_end");
						break;
					}
					case "turn_end": {
						console.log("[TUI]: turn_end");
						break;
					}
					case "error": {
						console.log("[TUI]: error");
						break;
					}
				}
				setBusy(false);
			},
		});
	}, [prompt, provider, syncChat, updateChat]);

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
					<text key={`${message.role}-${i}`}>{message.content}</text>
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
