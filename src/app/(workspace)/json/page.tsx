import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JSON Studio",
};

export default function JsonPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h2 className="text-xl font-semibold">JSON Studio</h2>
        <p className="text-muted-foreground text-sm">Coming soon.</p>
      </div>
    </div>
  );
}
