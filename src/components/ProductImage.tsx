"use client";

import { useMemo, useState } from "react";

type Props = {
  primarySrc?: string | null;
  fallbackSrc?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  unavailableLabel?: string;
};

export function ProductImage({
  primarySrc,
  fallbackSrc,
  alt,
  className = "",
  imgClassName = "",
  unavailableLabel = "Image unavailable",
}: Props) {
  const initial = useMemo(() => primarySrc || fallbackSrc || null, [primarySrc, fallbackSrc]);
  const [src, setSrc] = useState<string | null>(initial);
  const [triedFallback, setTriedFallback] = useState(false);

  if (!src) {
    return (
      <div className={className}>
        <div className="text-sm font-semibold text-slate-400">{unavailableLabel}</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <img
        src={src}
        alt={alt}
        className={imgClassName}
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => {
          if (!triedFallback && fallbackSrc && src !== fallbackSrc) {
            setTriedFallback(true);
            setSrc(fallbackSrc);
            return;
          }
          setSrc(null);
        }}
      />
    </div>
  );
}

export default ProductImage;
