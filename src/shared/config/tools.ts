import {
	ApiIcon,
	CodeFolderIcon,
	FileBracesIcon,
	FileTextIcon,
	PaletteIcon,
	RegexIcon,
} from "@hugeicons/core-free-icons";

export const toolNavItems = [
	{ title: "JSON Studio", url: "/json", icon: FileBracesIcon },
	{ title: "Snippet Manager", url: "/snippets", icon: CodeFolderIcon },
	{ title: "API Playground", url: "/api-playground", icon: ApiIcon },
	{ title: "Regex Playground", url: "/regex", icon: RegexIcon },
	{ title: "Markdown Studio", url: "/markdown", icon: FileTextIcon },
	{ title: "Color Studio", url: "/colors", icon: PaletteIcon },
] as const;

export const availableToolsCount = toolNavItems.length;
