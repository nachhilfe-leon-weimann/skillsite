import Image from "next/image";

import { cn } from "@skillsite/ui/utils/cn";
import { Card } from "@skillsite/ui/primitives/card";

const PROFILE_PHOTO_LIGHT = "/images/leon-ueber-mich-light.webp";
const PROFILE_PHOTO_DARK = "/images/leon-ueber-mich-dark.webp";

type ProfilePhotoProps = {
  /** CSS aspect-ratio, e.g. "4/5" (hero) or "5/4" (about). */
  aspect?: string;
  className?: string;
};

export function ProfilePhoto({ aspect = "4/5", className }: ProfilePhotoProps) {
  return (
    <Card
      surface="frame"
      radius="3xl"
      style={{ aspectRatio: aspect }}
      className={cn("relative overflow-hidden", className)}
    >
      <Image
        src={PROFILE_PHOTO_LIGHT}
        alt="Leon Weimann"
        fill
        sizes="(max-width: 880px) 100vw, 40vw"
        className="object-cover dark:hidden"
      />
      <Image
        src={PROFILE_PHOTO_DARK}
        alt="Leon Weimann"
        fill
        sizes="(max-width: 880px) 100vw, 40vw"
        className="hidden object-cover dark:block"
      />
    </Card>
  );
}
