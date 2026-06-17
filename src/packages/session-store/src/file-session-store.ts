import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Message } from "@artemis/llm-core";
import type { SessionStore } from "./types.ts";

export function createFileSessionStore(dir = "storage/sessions"): SessionStore {
	const fileFor = (id: string) => join(dir, `${id}.jsonl`);

	return {
		async load(sessionId) {
			try {
				const text = await readFile(fileFor(sessionId), "utf8");
				return text
					.split("\n")
					.filter((line) => line.trim().length > 0)
					.map((line) => JSON.parse(line) as Message);
			} catch {
				return []; // no file yet → fresh session
			}
		},

		async append(sessionId, message) {
			await mkdir(dir, { recursive: true }); // ensure ./sessions/ exists
			await appendFile(fileFor(sessionId), `${JSON.stringify(message)}\n`); // append; creates the file if missing
		},
	};
}
