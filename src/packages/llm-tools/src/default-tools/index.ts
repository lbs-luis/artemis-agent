import type { Tool } from "../types";
import getCurrentTime from "./get-current-time";
import scheduler from "./scheduler";

export function loadDefaultTools(): Tool[] {
	return [getCurrentTime, scheduler];
}
