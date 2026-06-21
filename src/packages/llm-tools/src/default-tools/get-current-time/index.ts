import type { Tool, ToolExecute } from "@artemis/llm-core";
import { saveLog } from "@artemis/logs";
import { description, name, schema } from "./schema.json";

const LOCALE = "pt-BR";

const execute: ToolExecute = async () => {
	const now = new Date();

	const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	const parts = new Intl.DateTimeFormat(LOCALE, {
		timeZone: timezone,
		weekday: "long",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).formatToParts(now);

	const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

	const date = `${get("year")}-${get("month")}-${get("day")}`;
	const time = `${get("hour")}:${get("minute")}:${get("second")}`;
	const weekday = get("weekday");

	const response = {
		date,
		time,
		weekday,
		timezone,
		human: `${weekday}, ${get("day")}/${get("month")}/${get("year")} às ${time}`,

		iso: now.toISOString(),
		unixTimestamp: now.getTime(),
	};

	saveLog({
		description: "[Tool]: getCurrentTime",
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
