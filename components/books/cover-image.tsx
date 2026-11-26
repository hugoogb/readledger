import Image from "next/image";
import { clothColor } from "@/lib/cloth";
import { cn } from "@/lib/utils";

type CoverImageProps = {
  src: string | null;
  title: string;
  sizes: string;
  className?: string;
  priority?: boolean;
};

export function CoverImage({ src, title, sizes, className, priority }: CoverImageProps) {
  return (
    <div
      className={cn(
        "relative aspect-2/3 w-full overflow-hidden rounded-[3px] shadow-[inset_3px_0_0_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.12)]",
        className,
      )}
    >
      {src ? (
        <>
          <Image src={src} alt="" fill sizes={sizes} priority={priority} className="object-cover" />
          <span className="pointer-events-none absolute inset-0 shadow-[inset_3px_0_0_rgba(0,0,0,0.18)]" />
        </>
      ) : (
        <div
          data-testid="cover-placeholder"
          aria-hidden="true"
          className="flex h-full w-full items-end p-[8%] shadow-[inset_3px_0_0_rgba(0,0,0,0.2)] [container-type:inline-size]"
          style={{ backgroundColor: clothColor(title) }}
        >
          <span className="line-clamp-4 font-serif text-[clamp(10px,9cqw,15px)] font-medium leading-tight text-[#fbf8f1]">
            {title}
          </span>
        </div>
      )}
    </div>
  );
}
