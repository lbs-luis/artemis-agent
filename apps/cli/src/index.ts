import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import {
	agentLoop,
	createOllamaProvider,
	type Message,
} from "@artemis/llm-core";

import { createFileSessionStore } from "@artemis/session-store";

const rl = readline.createInterface({ input, output });
const provider = createOllamaProvider({ model: "gemma4:12b" });
const store = createFileSessionStore();
const SESSION_ID = "machine-god";

const messages: Message[] = await store.load(SESSION_ID);
console.log(
	`[cli -> @artemis/session-store]: loaded ${messages.length} messages`,
);

async function getPrompt() {
	const prompt = await rl.question("Prompt: ");

	if (prompt.trim().length < 0) {
		getPrompt();
	}

	messages.push({ role: "user", content: prompt });
}

while (true) {
	await getPrompt();

	await agentLoop(messages, {
		provider,
		onEvent(event) {
			if (event.type === "text") process.stdout.write(event.text);
			else if (event.type === "tool_start")
				console.log(`\n[→ ${event.name}]`, event.args);
			else if (event.type === "tool_end")
				console.log(`[← ${event.name}]`, event.content);
			else if (event.type === "turn_end") process.stdout.write("\n");
			else if (event.type === "done") console.log("\n--- done ---");
			else if (event.type === "error") console.error("\nERROR:", event.message);
		},
	});

	await store.append(SESSION_ID, messages);
}
