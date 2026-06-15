import {
	appendFile,
	mkdir,
	readdir,
	readFile,
	writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import type { Tool, ToolSchema } from "./types";
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

const schema: ToolSchema = {
	type: "object",
	properties: {
		desc: {
			type: "string",
			description: "Description of the task",
		},
		gap: {
			type: "string",
			description: "Delay before execution, e.g. 5m, 1h",
		},
	},
	required: ["desc", "gap"],
};
const SchedulerTool: Tool = {
	name: "scheduler",
	description: "Tool that schedules tasks to execute between an time gap.",
	schema,
	async execute({ desc, gap }: { desc: string; gap: string }) {
		console.log("[llm-tools]: Desc: ", desc);
		console.log("[llm-tools]: Gap: ", gap);
	},
};

const defaultTools = [
	{
		name: SchedulerTool.name,
		description: SchedulerTool.description,
		schema: SchedulerTool.schema,
	},
];

export function createToolsStore(dir = "storage/tools"): ToolsStore {
	return {
		async load() {
			await mkdir(dir, { recursive: true });

			let files = await readdir(dir);

			files = files.filter((f) => f.endsWith(".json"));

			if (files.length === 0) {
				for (const tool of defaultTools) {
					await writeFile(
						join(dir, `${tool.name}.json`),
						JSON.stringify(tool, null, 2),
						"utf8",
					);
				}

				files = await readdir(dir);
			}

			const tools = await Promise.all(
				files
					.filter((f) => f.endsWith(".json"))
					.map(async (file) => {
						const text = await readFile(join(dir, file), "utf8");

						return JSON.parse(text);
					}),
			);

			return tools;
		},

		async append(toolName, newTool) {
			await mkdir(dir, { recursive: true }); // ensure ./storage/tools exists
			await appendFile(`${toolName}.json`, JSON.stringify(newTool)); // append; creates the file if missing
		},
	};
}
