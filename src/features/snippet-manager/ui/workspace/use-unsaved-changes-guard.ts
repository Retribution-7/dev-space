"use client";

import * as React from "react";

/**
 * Shows the browser confirmation dialog before a hard page unload while
 * there is unsaved work.
 */
export function useBeforeUnloadGuard(enabled: boolean) {
	React.useEffect(() => {
		if (!enabled) {
			return;
		}

		function handleBeforeUnload(event: BeforeUnloadEvent) {
			event.preventDefault();
			event.returnValue = "";
		}

		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [enabled]);
}

/**
 * Intercepts in-app link navigation while there is unsaved work and reports
 * the target to the caller instead of navigating right away.
 */
export function useUnsavedNavigationGuard(
	enabled: boolean,
	onNavigate: (href: string) => void,
) {
	const onNavigateRef = React.useRef(onNavigate);

	React.useEffect(() => {
		onNavigateRef.current = onNavigate;
	}, [onNavigate]);

	React.useEffect(() => {
		if (!enabled) {
			return;
		}

		function handleClick(event: MouseEvent) {
			if (
				event.defaultPrevented ||
				event.button !== 0 ||
				event.metaKey ||
				event.ctrlKey ||
				event.shiftKey ||
				event.altKey
			) {
				return;
			}

			const target = event.target;

			if (!(target instanceof Element)) {
				return;
			}

			const anchor = target.closest("a[href]");

			if (!(anchor instanceof HTMLAnchorElement)) {
				return;
			}

			if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
				return;
			}

			const url = new URL(anchor.href, window.location.href);

			if (url.origin !== window.location.origin) {
				return;
			}

			const isSamePage =
				url.pathname === window.location.pathname &&
				url.search === window.location.search &&
				url.hash === window.location.hash;

			if (isSamePage) {
				return;
			}

			event.preventDefault();
			onNavigateRef.current(url.pathname + url.search + url.hash);
		}

		document.addEventListener("click", handleClick, true);

		return () => {
			document.removeEventListener("click", handleClick, true);
		};
	}, [enabled]);
}
