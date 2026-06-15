import { createOllamaProvider, type Message } from "@artemis/llm-core";
import { createToolsStore } from "@artemis/llm-tools";
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

const toolsStore = createToolsStore();
const sessionStore = createFileSessionStore();

const provider = createOllamaProvider({ model: "gemma4:12b", tools: await toolsStore.load() });

const SESSION_ID = "tui-session";
const initial: Message[] = await sessionStore.load(SESSION_ID);

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
						store={sessionStore}
						sessionId={SESSION_ID}
						initial={initial}
					/>
				)
			}
		/>
	);
}
createRoot(renderer).render(<TUI />);
