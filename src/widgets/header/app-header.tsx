"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Moon01Icon, Sun01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const SECTION_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/json": "JSON Studio",
  "/snippets": "Snippet Manager",
  "/api-playground": "API Playground",
  "/regex": "Regex Playground",
  "/markdown": "Markdown Studio",
  "/colors": "Color Studio",
};

function ThemeToggle() {
  React.useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    document.documentElement.classList.toggle(
      "dark",
      stored ? stored === "dark" : prefersDark,
    );
  }, []);

  const toggleTheme = () => {
    const dark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", dark ? "dark" : "light");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <HugeiconsIcon icon={Moon01Icon} className="dark:hidden" />
      <HugeiconsIcon icon={Sun01Icon} className="hidden dark:block" />
    </Button>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const rootPath = `/${pathname.split("/")[1] ?? ""}`;
  const title = SECTION_TITLES[rootPath] ?? "DevSpace";

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="text-sm font-medium">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
