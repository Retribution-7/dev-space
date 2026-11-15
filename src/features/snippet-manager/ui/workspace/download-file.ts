"use client";

/** Triggers a browser download of the given text or binary content. */
export function downloadFile(
	content: string | Uint8Array,
	fileName: string,
	mimeType: string,
) {
	const blobPart: BlobPart =
		typeof content === "string" ? content : new Uint8Array(content);
	const blob = new Blob([blobPart], { type: mimeType });
	const objectUrl = URL.createObjectURL(blob);
	const anchor = document.createElement("a");

	anchor.href = objectUrl;
	anchor.download = fileName;
	anchor.style.display = "none";
	document.body.appendChild(anchor);

	try {
		anchor.click();
	} finally {
		anchor.remove();
		URL.revokeObjectURL(objectUrl);
	}
}
