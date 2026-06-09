import { useKeyboard } from "@opentui/react";

interface Props {
	onContinue: () => void;
}

export function GreetingScreen({ onContinue }: Props) {
	useKeyboard((key) => {
		if (key.ctrl && key.name === "c") return;
		onContinue();
	});

	return (
		<box
			style={{
				flexDirection: "column",
				flexGrow: 1,
			}}
		>
			<ascii-font text="Artemis Agent" font="tiny" />
			<text style={{ marginTop: "auto" }}>press any key to continue</text>
		</box>
	);
}
