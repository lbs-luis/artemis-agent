import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Tool } from "../types";

export async function loadDefaultTools(
	dir: string = "src/packages/llm-tools/src/default-tools",
): Promise<Tool[]> {
	const files = (await readdir(dir)).filter((file) => file.endsWith(".json"));

	if (files.length === 0) return [];

	return await Promise.all(
		files.map(async (file) => {
			const fileContent = await readFile(join(dir, file), "utf8");

			return JSON.parse(fileContent) as Tool;
		}),
	);
}
