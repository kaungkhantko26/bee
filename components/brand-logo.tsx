import Image from "next/image";
import Link from "next/link";
import { cn } from "@/components/ui";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  imageClassName?: string;
  tagline?: string;
};

export function BrandLogo({
  compact = false,
  className,
  imageClassName,
  tagline = "Super app for home services",
}: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-12 w-12 overflow-hidden rounded-[1rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,237,157,0.9))] shadow-[0_14px_28px_rgba(94,74,0,0.14),inset_0_1px_0_rgba(255,255,255,0.95)]">
        <Image
          src="/kkko.png"
          alt="BEE logo"
          fill
          sizes="48px"
          className={cn("object-cover", imageClassName)}
          priority
        />
      </div>
      {compact ? null : (
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--foreground)]">
            BEE
          </p>
          <p className="text-sm text-[var(--muted)]">{tagline}</p>
        </div>
      )}
    </div>
  );
}

export function BrandLogoLink({
  href,
  compact = false,
  className,
  imageClassName,
  tagline,
}: BrandLogoProps & { href: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center", className)}>
      <BrandLogo compact={compact} imageClassName={imageClassName} tagline={tagline} />
    </Link>
  );
}
