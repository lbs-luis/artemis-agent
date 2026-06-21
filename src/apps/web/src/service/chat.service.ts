import type { Dispatch, SetStateAction } from "react";
import type { Message } from "@/types/chat.types";

export async function sendChatMessage(
	prompt: string,
	setMessages: Dispatch<SetStateAction<Message[]>>,
) {
	const text = prompt.trim();

	if (!text) return;

	setMessages((p) => [...p, { role: "assistant", content: "" }]);

	try {
		const res = await fetch("/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ prompt: text }),
		});
		if (!res.body) throw new Error("No response");

		const reader = res.body.getReader();
		const decoder = new TextDecoder();

		while (true) {
			const { value, done } = await reader.read();
			if (done) break;

			const chunk = decoder.decode(value, { stream: true });

			setMessages((p) => {
				const next = [...p];
				const last = next[next.length - 1];
				if (!last) return p;

				next[next.length - 1] = { ...last, content: last.content + chunk };
				return next;
			});
		}
	} catch (error) {
		console.error(error);
		return null;
	}
}
