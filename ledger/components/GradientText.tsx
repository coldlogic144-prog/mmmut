import { cn } from "@/lib/utils";

/**
 * GradientText — animated purple→pink headline.
 *
 * The `ledger-gradient` keyframe (defined in tailwind.config.ts) sweeps the
 * background position, giving a living, "cool" gradient sheen to headings.
 */
export default function GradientText({
  children,
  className,
  as: Tag = "span",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3";
}) {
  return (
    <Tag
      className={cn(
        "bg-clip-text bg-[linear-gradient(120deg,#8b5cf6,#ec4899,#8b5cf6)]",
        "text-transparent bg-[length:200%_auto] animate-ledger-gradient",
        className,
      )}
    >
      {children}
    </Tag>
  );
}