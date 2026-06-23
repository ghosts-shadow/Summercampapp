import Image from "next/image";

import { cn } from "@/lib/utils";
import { CAMP } from "@/lib/constants";

/**
 * The official camp badge. The source image has a white background, so it's
 * rendered inside a white "coin" that reads cleanly on light and dark surfaces.
 */
export function CampLogo({
  size = 36,
  className,
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-black/5",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.png"
        alt={`${CAMP.name} logo`}
        width={size}
        height={size}
        priority={priority}
      />
    </span>
  );
}
