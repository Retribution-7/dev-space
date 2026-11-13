import * as React from "react";

const THEME_STORAGE_KEY = "theme";

function applyStoredTheme() {
	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	document.documentElement.classList.toggle(
		"dark",
		stored ? stored === "dark" : prefersDark,
	);
}

export function useTheme() {
	React.useLayoutEffect(() => {
		applyStoredTheme();
	}, []);

	const toggleTheme = React.useCallback(() => {
		const dark = document.documentElement.classList.toggle("dark");
		localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
	}, []);

	return { toggleTheme };
}
