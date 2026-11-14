import {
	ApiIcon,
	CodeFolderIcon,
	FileBracesIcon,
	FileTextIcon,
	PaletteIcon,
	RegexIcon,
} from "@hugeicons/core-free-icons";

export const toolNavItems = [
	{
		id: "json-studio",
		title: "JSON Studio",
		url: "/json",
		icon: FileBracesIcon,
	},
	{
		id: "snippet-manager",
		title: "Snippet Manager",
		url: "/snippets",
		icon: CodeFolderIcon,
	},
	{
		id: "api-playground",
		title: "API Playground",
		url: "/api-playground",
		icon: ApiIcon,
	},
	{
		id: "regex-playground",
		title: "Regex Playground",
		url: "/regex",
		icon: RegexIcon,
	},
	{
		id: "markdown-studio",
		title: "Markdown Studio",
		url: "/markdown",
		icon: FileTextIcon,
	},
	{
		id: "color-studio",
		title: "Color Studio",
		url: "/colors",
		icon: PaletteIcon,
	},
] as const;

export type ToolNavItem = (typeof toolNavItems)[number];

export const availableToolsCount = toolNavItems.length;

export function findToolByPath(pathname: string): ToolNavItem | undefined {
	return toolNavItems.find(
		(tool) => pathname === tool.url || pathname.startsWith(`${tool.url}/`),
	);
}

export function findToolById(toolId: string): ToolNavItem | undefined {
	return toolNavItems.find((tool) => tool.id === toolId);
}
