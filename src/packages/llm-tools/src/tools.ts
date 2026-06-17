import { appendFile, mkdir, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadDefaultTools } from "./helpers/load-default-tools";
import type { Tool } from "./types";
import type { ToolsStore } from "./types/store.types";

// const example = [
// 	{
// 		type: "function",
// 		function: {
// 			name: "scheduler",
// 			description: "Schedule a task to run later",
// 			parameters: {
// 				type: "object",
// 				properties: {
// 					desc: { type: "string" },
// 					gap: { type: "string" },
// 				},
// 				required: ["desc", "gap"],
// 			},
// 		},
// 	},
// ];

export function createToolsStore(dir = "storage/tools"): ToolsStore {
	return {
		async load() {
			await mkdir(dir, { recursive: true });

			let files = await readdir(dir);

			files = files.filter((f) => f.endsWith(".json"));

			if (files.length === 0) {
				return await loadDefaultTools();
			}

			const tools = await Promise.all(
				files
					.filter((f) => f.endsWith(".json"))
					.map(async (file) => {
						const text = await readFile(join(dir, file), "utf8");

						return JSON.parse(text) as Tool;
					}),
			);

			return [...tools, ...(await loadDefaultTools())];
		},

		async append(toolName, newTool) {
			await mkdir(dir, { recursive: true }); // ensure ./storage/tools exists
			await appendFile(`${toolName}.json`, JSON.stringify(newTool)); // append; creates the file if missing
		},
	};
}
