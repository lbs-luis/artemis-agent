import { agentLoop } from "@artemis/llm-core";
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import { createOllamaProvider } from "./packages/llm-core/providers/ollama/ollama.provider";

const rl = readline.createInterface({ input, output });

const provider = createOllamaProvider({ model: "gemma4:12b" });

let i = 1;
while (true) {
	const prompt = await rl.question("Sua mensagem: ");

	if (prompt.trim().length > 0) {
		await agentLoop(prompt, {
			provider,
			onEvent(event) {
				if (event.type === "text") process.stdout.write(event.text);
				else if (event.type === "tool_start")
					console.log(`\n[→ ${event.name}]`, event.args);
				else if (event.type === "tool_end")
					console.log(`[← ${event.name}]`, event.content);
				else if (event.type === "turn_end") process.stdout.write("\n");
				else if (event.type === "done") console.log("\n--- done ---");
				else if (event.type === "error")
					console.error("\nERROR:", event.message);
			},
		});
	}

	console.log("[CLI]: RUN: ", i);
	i++;
}
