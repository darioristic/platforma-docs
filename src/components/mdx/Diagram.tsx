import Image from "next/image";

export default function Diagram({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="my-8 not-prose">
      <div className="rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--muted)]">
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={600}
          className="w-full h-auto"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-[var(--muted-foreground)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
