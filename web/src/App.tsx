import { useState } from "react";
import { sendChatMessage } from "./service/chat.service";
import type { Message } from "./types/chat.types";

export default function App() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [prompt, setPrompt] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSendMessage() {
		if (loading) return;

		const text = prompt;
		setPrompt("");
		setLoading(true);

		await sendChatMessage(text, setMessages);
		setLoading(false);
	}

	return (
		<main className="flex flex-col w-full h-dvh bg-black">
			<div className="flex flex-col w-2/3 bg-slate-800 m-auto text-slate-200 p-4 rounded-lg gap-4">
				<h1>Artemis Agent</h1>
				<div className="text-slate-300 size-full flex flex-col rounded-lg border border-slate-300 min-h-12">
					{messages.map((message, i) => (
						<p
							key={`${message.role}-${i}`}
							className="size-fit text-slate-300 font-normal text-sm"
						>
							{message.content}
						</p>
					))}
				</div>
			</div>
			<form
				className="flex flex-row gap-4 w-full mt-auto h-10 px-4 pb-4 items-center"
				action={handleSendMessage}
			>
				<input
					placeholder="Sua mensagem aqui"
					className="flex size-full text-slate-200 bg-slate-600 p-4 rounded-sm"
					onChange={(e) => setPrompt(e.target.value)}
				/>
				<button
					className="flex w-fit h-full p-4 bg-slate-300 text-slate-900 items-center justify-center rounded-sm hover:bg-slate-100"
					type="submit"
				>
					Enviar
				</button>
			</form>
		</main>
	);
}
