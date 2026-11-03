import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { SocialLinks } from "@/components/layout/social-links";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { primaryNav, platformNav } from "@/content/site";
import { contactDetails } from "@/content/contact";
import { routes } from "@/lib/routes";

const legalLinkClass = "text-on-navy-muted transition-colors hover:text-white";
const footerLinkClass =
  "w-fit text-small text-on-navy-soft transition-colors hover:text-white";

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-eyebrow uppercase text-on-navy-muted">{title}</p>
      <nav className="flex flex-col gap-2.5">{children}</nav>
    </div>
  );
}

/** Internal routes use next/link; http/mailto/tel render a plain anchor. */
function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const isExternal = /^(https?:|mailto:|tel:)/.test(href);
  if (isExternal) {
    const isHttp = href.startsWith("http");
    return (
      <a
        href={href}
        className={footerLinkClass}
        {...(isHttp ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={footerLinkClass}>
      {children}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="bg-navy pb-[env(safe-area-inset-bottom)] text-on-navy-soft">
      <Container className="py-[clamp(40px,5vw,56px)]">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="flex flex-col items-start gap-4">
            <Link href={routes.home} aria-label="Startseite">
              <Logo onDark />
            </Link>
            <p className="max-w-[26em] text-small text-on-navy-muted">
              Persönliche Online-Nachhilfe in Mathematik, Informatik und Physik
              – flexibel und auf Augenhöhe.
            </p>
            <SocialLinks className="mt-1" />
          </div>

          <FooterColumn title="Navigation">
            {primaryNav.map((item) => (
              <FooterLink key={item.href} href={item.href}>
                {item.label}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Online lernen">
            {platformNav.map((item) => (
              <FooterLink key={`${item.href}:${item.label}`} href={item.href}>
                {item.label}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Kontakt">
            <FooterLink href={contactDetails.whatsapp.href}>
              WhatsApp
            </FooterLink>
            <FooterLink href={contactDetails.eMail.href}>E-Mail</FooterLink>
          </FooterColumn>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-5 gap-y-4 border-t border-white/15 pt-5 text-caption text-on-navy-muted">
          <span>© {new Date().getFullYear()} Nachhilfe Leon Weimann</span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href={routes.impressum} className={legalLinkClass}>
              Impressum
            </Link>
            <Link href={routes.datenschutz} className={legalLinkClass}>
              Datenschutz
            </Link>
            <Link href={routes.agb} className={legalLinkClass}>
              AGB
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </Container>
    </footer>
  );
}
