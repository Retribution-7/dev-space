import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Not Found",
};

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h2 className="text-xl font-semibold">Not Found</h2>
        <p className="text-muted-foreground text-sm">
          Could not find requested resource.
        </p>
      </div>
      <div>
        <Link
          href="/dashboard"
          className={buttonVariants({ variant: "outline" })}
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
