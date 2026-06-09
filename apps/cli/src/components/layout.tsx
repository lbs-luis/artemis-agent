import type { CliRenderer } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useState } from "react";

interface Props {
	renderer: CliRenderer;
	screen: React.JSX.Element;
}

export function TuiLayout({ renderer, screen }: Props) {
	const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);
	useKeyboard((key) => {
		if (key.ctrl && key.name === "t") {
			setIsConsoleOpen(!isConsoleOpen);
			renderer.console.toggle();
		}
	});

	return (
		<box
			style={{
				flexGrow: 1,
				width: isConsoleOpen ? "70%" : "100%",
				height: "100%",
				padding: 1,
			}}
		>
			{screen}
		</box>
	);
}
