import { useEffect, useState } from "react";

/**
 * Typewriter — cycles an array of phrases with a blinking caret.
 *
 * Pure client state (no motion) so it stays lightweight; the caret blink is
 * the CSS keyframe `animate-blink` from tailwind.config.ts.
 */
export default function Typewriter({
  phrases,
  className,
  typeMs = 70,
  deleteMs = 35,
  holdMs = 1600,
}: {
  phrases: string[];
  className?: string;
  typeMs?: number;
  deleteMs?: number;
  holdMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[index % phrases.length];
    if (!deleting && text === current) {
      const t = setTimeout(() => setDeleting(true), holdMs);
      return () => clearTimeout(t);
    }
    if (deleting && text === "") {
      setDeleting(false);
      setIndex((i) => (i + 1) % phrases.length);
      return;
    }
    const step = setTimeout(
      () => {
        setText(
          deleting
            ? current.slice(0, text.length - 1)
            : current.slice(0, text.length + 1),
        );
      },
      deleting ? deleteMs : typeMs,
    );
    return () => clearTimeout(step);
  }, [text, deleting, index, phrases, typeMs, deleteMs, holdMs]);

  return (
    <span className={className}>
      {text || "\u00A0"}
      <span className="ml-1 inline-block h-[1em] w-[2px] bg-violet animate-blink" aria-hidden />
    </span>
  );
}