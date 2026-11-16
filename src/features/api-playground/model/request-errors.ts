export const MIXED_CONTENT_MESSAGE =
	"This page is served over HTTPS, and browsers block HTTP requests as mixed content. Use an HTTPS URL instead.";

export const NETWORK_ERROR_MESSAGE =
	"The request could not reach the server. It may be unavailable, or the browser may have blocked the request.";

export const NETWORK_ERROR_HINTS = [
	"Check that the URL is correct and that the server is running.",
	"CORS: if the API is on another origin, it must allow this site's origin. Browsers cannot bypass CORS; use a backend proxy if the API does not allow browser requests.",
	"Mixed content: a page served over HTTPS cannot call an HTTP URL. Use an HTTPS URL.",
] as const;

export const UNEXPECTED_REQUEST_ERROR_MESSAGE =
	"Something went wrong while sending the request. Try again or check the request configuration.";

export function createTimeoutErrorMessage(timeoutMs: number): string {
	return `The request timed out after ${formatTimeoutDuration(timeoutMs)}. The server did not respond in time; try again or increase the timeout.`;
}

function formatTimeoutDuration(timeoutMs: number): string {
	if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
		return "the configured timeout";
	}

	const seconds = timeoutMs / 1000;

	return Number.isInteger(seconds)
		? `${seconds} seconds`
		: `${seconds.toFixed(1)} seconds`;
}
