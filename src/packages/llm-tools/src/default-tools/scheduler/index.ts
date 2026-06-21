import type { Tool, ToolExecute } from "@artemis/llm-core";
import { saveLog } from "@artemis/logs";
import { description, name, schema } from "./schema.json";

const execute: ToolExecute = async ({ task, time, repeat }) => {
	const response = {
		status: "scheduled",
		message: `Tarefa "${task}" agendada para ${time}${repeat ? " (repetindo)" : ""}.`,
	};

	saveLog({
		description: "[Tool]:Scheduler",
		content: response,
	});

	return response;
};

export default {
	name,
	description,
	execute,
	schema,
} satisfies Tool;
