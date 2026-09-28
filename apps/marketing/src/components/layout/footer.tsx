import Link from "next/link";
import {
  SiDiscord,
  SiGithub,
  SiInstagram,
  SiTiktok,
  SiWhatsapp,
  SiYoutube,
} from "@icons-pack/react-simple-icons";

import { Container } from "@skillsite/ui/layout/container";
import { TextLink } from "@skillsite/ui/primitives/link";
import { Logo } from "@skillsite/ui/shell/logo";
import { ThemeToggle } from "@skillsite/ui/shell/theme-toggle";
import { cn } from "@skillsite/ui/utils/cn";
import { brand, primaryNav, platformNav } from "@/content/site";
import { socials, type SocialKey } from "@/content/socials";
import { contactDetails } from "@/content/contact";
import { Eyebrow } from "@skillsite/ui/typography/eyebrow";
import { routes } from "@/lib/routes";

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Eyebrow as="p" dot={false} tone="inverse-muted">
        {title}
      </Eyebrow>
      <nav className="flex flex-col gap-2.5">{children}</nav>
    </div>
  );
}

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
            <TextLink
              variant="inverse-muted"
              href={social.href}
              aria-label={social.label}
              className="block"
            >
              <Icon size={20} aria-hidden />
            </TextLink>
          </li>
        );
      })}
    </ul>
  );
}

export function Footer() {
  return (
    <footer className="bg-navy pb-[env(safe-area-inset-bottom)] text-on-navy-soft">
      <Container className="py-footer">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="flex flex-col items-start gap-4">
            <Link href={routes.home} aria-label="Startseite">
              <Logo
                name={brand.name}
                tagline={brand.tagline}
                src={brand.logo}
                tone="inverse"
              />
            </Link>
            <p className="max-w-measure-26 text-small text-on-navy-muted">
              Persönliche Online-Nachhilfe in Mathematik, Informatik und Physik
              – flexibel und auf Augenhöhe.
            </p>
            <SocialLinks className="mt-1" />
          </div>

          <FooterColumn title="Navigation">
            {primaryNav.map((item) => (
              <TextLink variant="inverse" key={item.href} href={item.href}>
                {item.label}
              </TextLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Online lernen">
            {platformNav.map((item) => (
              <TextLink
                variant="inverse"
                key={`${item.href}:${item.label}`}
                href={item.href}
              >
                {item.label}
              </TextLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Kontakt">
            <TextLink variant="inverse" href={contactDetails.whatsapp.href}>
              WhatsApp
            </TextLink>
            <TextLink variant="inverse" href={contactDetails.eMail.href}>
              E-Mail
            </TextLink>
          </FooterColumn>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-5 gap-y-4 border-t border-overlay-15 pt-5 text-caption text-on-navy-muted">
          <span>© {new Date().getFullYear()} Nachhilfe Leon Weimann</span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <TextLink variant="inverse-muted" href={routes.impressum}>
              Impressum
            </TextLink>
            <TextLink variant="inverse-muted" href={routes.datenschutz}>
              Datenschutz
            </TextLink>
            <TextLink variant="inverse-muted" href={routes.agb}>
              AGB
            </TextLink>
            <ThemeToggle />
          </div>
        </div>
      </Container>
    </footer>
  );
}
