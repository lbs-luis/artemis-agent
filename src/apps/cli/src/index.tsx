import {
	createOllamaProvider,
	type Message,

} from "@artemis/llm-core";
import { createFileSessionStore } from "@artemis/session-store";
import { ConsolePosition, createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { useState } from "react";
import { TuiLayout } from "./components/layout.tsx";
import { ChatScreen } from "./screens/chat.screen.tsx";
import { GreetingScreen } from "./screens/greeting.screen.tsx";

const renderer = await createCliRenderer({
	exitOnCtrlC: true,
	consoleOptions: {
		position: ConsolePosition.RIGHT,
		sizePercent: 30,
	},
});

const sessions_store = createFileSessionStore();



const provider = createOllamaProvider({ model: "gemma4:12b" });

const SESSION_ID = "tui-session";
const initialChat: Message[] = await sessions_store.load(SESSION_ID);

type Screen = "greeting" | "chat";

function TUI() {
	const [screen, setScreen] = useState<Screen>("greeting");

	return (
		<TuiLayout
			renderer={renderer}
			screen={
				screen === "greeting" ? (
					<GreetingScreen onContinue={() => setScreen("chat")} />
				) : (
					<ChatScreen
						provider={provider}
						session={{
							chat: initialChat,
							update: (message: Message) =>
								sessions_store.append(SESSION_ID, message),
						}}
					/>
				)
			}
		/>
	);
}
createRoot(renderer).render(<TUI />);
