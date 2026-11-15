export type JsonDifferenceType = "added" | "removed" | "changed";

export type JsonAddedDifference = {
	type: "added";
	path: string;
	newValue: unknown;
};

export type JsonRemovedDifference = {
	type: "removed";
	path: string;
	oldValue: unknown;
};

export type JsonChangedDifference = {
	type: "changed";
	path: string;
	oldValue: unknown;
	newValue: unknown;
};

export type JsonDifference =
	JsonAddedDifference | JsonRemovedDifference | JsonChangedDifference;

export type CompareDocument = "original" | "modified";

export type CompareDocumentIssue =
	| { document: CompareDocument; reason: "empty" }
	| { document: CompareDocument; reason: "invalid"; message: string };

export type CompareJsonResult =
	| { status: "success"; differences: JsonDifference[] }
	| { status: "error"; issues: CompareDocumentIssue[] };
