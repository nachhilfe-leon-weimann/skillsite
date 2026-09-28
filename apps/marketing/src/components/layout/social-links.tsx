import {
  SiDiscord,
  SiGithub,
  SiInstagram,
  SiTiktok,
  SiWhatsapp,
  SiYoutube,
} from "@icons-pack/react-simple-icons";

import { socials, type SocialKey } from "@/content/socials";
import { cn } from "@skillsite/ui/utils/cn";

type IconType = typeof SiDiscord;

const iconByKey: Record<SocialKey, IconType> = {
  discord: SiDiscord,
  whatsapp: SiWhatsapp,
  instagram: SiInstagram,
  youtube: SiYoutube,
  tiktok: SiTiktok,
  github: SiGithub,
};

export function SocialLinks({ className }: { className?: string }) {
  return (
    <ul
      className={cn("flex flex-wrap items-center gap-x-5 gap-y-2", className)}
    >
      {socials.map((social) => {
        const Icon = iconByKey[social.key];
        return (
          <li key={social.key}>
            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className="block text-on-navy-muted transition-colors hover:text-white"
            >
              <Icon size={20} aria-hidden />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
