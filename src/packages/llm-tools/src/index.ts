import { loadDefaultTools } from "./default-tools";

async function load() {
	return [...loadDefaultTools()];
}

const llmTools = { load };
export default llmTools;
