"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

import { cn } from "@skillsite/ui/utils/cn";
import { Container } from "@skillsite/ui/layout/container";
import { Collapsible } from "@skillsite/ui/motion/collapsible";
import { Logo } from "@skillsite/ui/shell/logo";
import { Button } from "@skillsite/ui/primitives/button";
import { NavLink } from "@skillsite/ui/primitives/link";
import { IconButton } from "@skillsite/ui/primitives/icon-button";
import { brand, primaryCta, primaryNav, platformNav } from "@/content/site";
import { useBodyScrollLock } from "@skillsite/ui/hooks/use-body-scroll-lock";
import { useMediaQuery } from "@skillsite/ui/hooks/use-media-query";
import { DESKTOP_NAV_QUERY } from "@/lib/breakpoints";
import { routes } from "@/lib/routes";
import { MENU_STATE_EVENT } from "@/components/layout/ios-toolbar-tint";

/** Whether `href` points at the section the user is currently on. */
function isActive(pathname: string, href: string) {
  const base = href.split("#")[0] ?? href;
  return base === "/" ? pathname === "/" : pathname.startsWith(base);
}

/** Shared text emphasis for nav links, depending on active state. */
function activeText(active: boolean) {
  return active ? "font-semibold text-ink" : "font-medium text-ink-soft";
}

function isPlatformNavActive(pathname: string) {
  return platformNav.some((item) => isActive(pathname, item.href));
}

/** `aria-current` for a page link; a `#section` link is never the current page. */
function currentPage(pathname: string, href: string) {
  return !href.includes("#") && isActive(pathname, href) ? "page" : undefined;
}

export function Navbar() {
  const pathname = usePathname();

  return <NavbarContent key={pathname} pathname={pathname} />;
}

function NavbarContent({ pathname }: { pathname: string }) {
  const isDesktopNav = useMediaQuery(DESKTOP_NAV_QUERY);
  const [open, setOpen] = useState(false);
  const isPlatformActive = isPlatformNavActive(pathname);

  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMobileMenu = () => setOpen(false);
  const toggleMobileMenu = () => setOpen((value) => !value);

  useBodyScrollLock(open && !isDesktopNav);

  // Escape closes the mobile menu and hands focus back to its button.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Tell the iOS toolbar tint about the menu state: it hides itself while the
  // menu is open (so Safari samples the menu, not a stale navy strip) and forces
  // a re-sample on close. Skip the initial mount (menu starts closed).
  const prevOpen = useRef(false);
  useEffect(() => {
    if (open === prevOpen.current) return;
    prevOpen.current = open;
    window.dispatchEvent(
      new CustomEvent(MENU_STATE_EVENT, { detail: { open } }),
    );
  }, [open]);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(DESKTOP_NAV_QUERY);
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };

    mediaQueryList.addEventListener("change", closeOnDesktop);
    return () => {
      mediaQueryList.removeEventListener("change", closeOnDesktop);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-sticky border-b border-line bg-glass backdrop-blur-lg",
        open &&
          "max-nav:fixed max-nav:inset-0 max-nav:flex max-nav:flex-col max-nav:border-b-0 max-nav:bg-bg",
      )}
    >
      <Container className="flex items-center gap-2.5 py-3 nav-wide:gap-4">
        <Link
          href={routes.home}
          aria-label="Startseite"
          onClick={closeMobileMenu}
          className="shrink-0"
        >
          <Logo name={brand.name} tagline={brand.tagline} src={brand.logo} />
        </Link>

        <DesktopNav pathname={pathname} platformActive={isPlatformActive} />

        <div className="ml-auto flex items-center gap-2 nav:ml-0 nav-wide:gap-2.5">
          <Button
            asChild
            variant="primary"
            size="md"
            className="hidden px-4 nav:inline-flex nav-wide:px-5"
          >
            <Link href={primaryCta.href}>
              {/* Short label in the compact range, full label once there is room. */}
              <span className="nav-wide:hidden">{primaryCta.shortLabel}</span>
              <span className="hidden nav-wide:inline">{primaryCta.label}</span>
            </Link>
          </Button>
          <IconButton
            ref={menuButtonRef}
            hover="none"
            aria-label="Menü"
            aria-expanded={open}
            onClick={toggleMobileMenu}
            className="inline-flex nav:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </IconButton>
        </div>
      </Container>

      {open ? (
        <MobileMenu
          pathname={pathname}
          platformActive={isPlatformActive}
          onNavigate={closeMobileMenu}
        />
      ) : null}
    </header>
  );
}

function DesktopNav({
  pathname,
  platformActive,
}: {
  pathname: string;
  platformActive: boolean;
}) {
  return (
    <nav className="hidden flex-1 items-center justify-end gap-0.5 nav:flex nav-wide:gap-1">
      {primaryNav.map((item) => (
        <Button
          asChild
          key={item.href}
          variant="ghost"
          aria-current={currentPage(pathname, item.href)}
          className={cn(
            "px-3 nav-wide:px-3.5",
            activeText(isActive(pathname, item.href)),
          )}
        >
          <Link href={item.href}>{item.label}</Link>
        </Button>
      ))}

      <PlatformDropdown pathname={pathname} active={platformActive} />
    </nav>
  );
}

function PlatformDropdown({
  pathname,
  active,
}: {
  pathname: string;
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} data-open={open || undefined} className="group relative">
      <Button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        variant="ghost"
        onClick={() => setOpen((value) => !value)}
        className={cn("px-3 nav-wide:px-3.5", activeText(active))}
      >
        Online lernen
        <ChevronDown
          className="size-3.5 transition-transform duration-quick group-hover:rotate-180 group-data-open:rotate-180"
          aria-hidden
        />
      </Button>

      <div
        id={panelId}
        className="invisible absolute right-0 top-full z-raised w-64 translate-y-2 pt-1.5 opacity-0 transition-[opacity,translate,visibility] duration-base ease-flow group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-data-open:visible group-data-open:translate-y-0 group-data-open:opacity-100"
      >
        <div className="flex flex-col gap-0.5 rounded-2xl border border-line bg-surface p-2 shadow-card">
          {platformNav.map((item) => (
            <Button
              asChild
              key={`${item.href}:${item.label}`}
              variant="ghost"
              aria-current={currentPage(pathname, item.href)}
              onClick={() => setOpen(false)}
              className="flex flex-col items-start gap-0.5 rounded-xl px-3 py-2.5"
            >
              <Link href={item.href}>
                <span className="text-body font-semibold text-ink">
                  {item.label}
                </span>
                <span className="text-caption text-ink-soft">{item.note}</span>
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileMenu({
  pathname,
  platformActive,
  onNavigate,
}: {
  pathname: string;
  platformActive: boolean;
  onNavigate: () => void;
}) {
  const [platformOpen, setPlatformOpen] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col nav:hidden motion-safe:animate-fade-down">
      <Container className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto py-4">
        {primaryNav.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            active={isActive(pathname, item.href)}
            aria-current={currentPage(pathname, item.href)}
            onClick={onNavigate}
          >
            {item.label}
          </NavLink>
        ))}

        <button
          type="button"
          aria-expanded={platformOpen}
          aria-controls="mobile-platform-nav"
          onClick={() => setPlatformOpen((value) => !value)}
          className={cn(
            "flex items-center justify-between border-b border-line py-3 text-body",
            activeText(platformActive),
          )}
        >
          Online lernen
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-quick",
              platformOpen && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        <Collapsible open={platformOpen} id="mobile-platform-nav">
          <div className="flex flex-col">
            {platformNav.map((item) => (
              <NavLink
                key={`${item.href}:${item.label}`}
                variant="menu-sub"
                href={item.href}
                active={isActive(pathname, item.href)}
                aria-current={currentPage(pathname, item.href)}
                onClick={onNavigate}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </Collapsible>
      </Container>

      <Container className="flex flex-col gap-2 border-t border-line py-4">
        <Button
          asChild
          variant="primary"
          onClick={onNavigate}
          className="w-full"
        >
          <Link href={primaryCta.href}>{primaryCta.label}</Link>
        </Button>
      </Container>
    </div>
  );
}
