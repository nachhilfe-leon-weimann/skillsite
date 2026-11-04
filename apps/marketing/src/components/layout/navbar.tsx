"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

import { cn } from "@skillsite/ui/utils/cn";
import { Container } from "@skillsite/ui/layout/container";
import { Collapsible } from "@skillsite/ui/motion/collapsible";
import { Logo } from "@skillsite/ui/shell/logo";
import { Button } from "@skillsite/ui/primitives/button";
import { NavLink } from "@skillsite/ui/primitives/link";
import { IconButton } from "@skillsite/ui/primitives/icon-button";
import { Dialog } from "@skillsite/ui/overlays/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@skillsite/ui/overlays/popover";
import { brand, primaryCta, primaryNav, platformNav } from "@/content/site";
import { DESKTOP_NAV_QUERY } from "@/lib/breakpoints";
import { routes } from "@/lib/routes";
import {
  MENU_STATE_EVENT,
  type MenuStateDetail,
} from "@/components/layout/ios-toolbar-tint";

/** The media query behind CSS `hover:` styles: a primary pointer that can hover. */
const HOVER_QUERY = "(hover: hover)";

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
  const [open, setOpen] = useState(false);
  const isPlatformActive = isPlatformNavActive(pathname);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const homeLinkRef = useRef<HTMLAnchorElement>(null);

  const openMobileMenu = () => setOpen(true);
  const closeMobileMenu = () => setOpen(false);

  // Tell the iOS toolbar tint about the menu state: it hides itself while the
  // menu is open (so Safari samples the menu, not a stale navy strip) and forces
  // a re-sample on close. Skip the initial mount (menu starts closed); an open
  // menu that unmounts (a route change re-keys this component) reports closed.
  const announcedOpen = useRef(false);
  useEffect(() => {
    if (open === announcedOpen.current) return;
    announcedOpen.current = open;
    announceMenuState(open);
  }, [open]);
  useEffect(
    () => () => {
      if (!announcedOpen.current) return;
      announcedOpen.current = false;
      announceMenuState(false);
    },
    [],
  );

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
    <>
      {/* While the menu is open, its dialog carries the header; this one stays
          in place, out of focus and the accessibility tree, so nothing exists
          twice and the page beneath does not move. */}
      <header
        inert={open}
        className="sticky top-0 z-sticky border-b border-line bg-glass backdrop-blur-lg"
      >
        <HeaderRow
          homeLinkRef={homeLinkRef}
          nav={
            <DesktopNav pathname={pathname} platformActive={isPlatformActive} />
          }
        >
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
          <MenuButton
            ref={menuButtonRef}
            expanded={open}
            onClick={openMobileMenu}
          >
            <Menu className="size-5" />
          </MenuButton>
        </HeaderRow>
      </header>

      <MobileMenu
        open={open}
        onClose={closeMobileMenu}
        pathname={pathname}
        platformActive={isPlatformActive}
        // Escape and the close control return to the menu button; past the
        // desktop breakpoint, where it is hidden, the visible home link.
        returnFocusRef={menuButtonRef}
        homeLinkRef={homeLinkRef}
      />
    </>
  );
}

function announceMenuState(open: boolean) {
  window.dispatchEvent(
    new CustomEvent<MenuStateDetail>(MENU_STATE_EVENT, { detail: { open } }),
  );
}

/**
 * The header row: home link, the desktop navigation (page header only) and the
 * trailing controls. The page header and the open menu share it, so the menu's
 * home link and close control sit exactly where the page header's do.
 */
function HeaderRow({
  homeLinkRef,
  onHome,
  nav,
  children,
}: {
  homeLinkRef?: React.Ref<HTMLAnchorElement>;
  onHome?: () => void;
  nav?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Container className="flex items-center gap-2.5 py-3 nav-wide:gap-4">
      <Link
        ref={homeLinkRef}
        href={routes.home}
        aria-label="Startseite"
        onClick={onHome}
        className="shrink-0"
      >
        <Logo name={brand.name} tagline={brand.tagline} src={brand.logo} />
      </Link>

      {nav}

      <div className="ml-auto flex items-center gap-2 nav:ml-0 nav-wide:gap-2.5">
        {children}
      </div>
    </Container>
  );
}

/** The mobile menu control: the opener in the page header, the close control in the menu. */
function MenuButton({
  ref,
  id,
  expanded,
  onClick,
  children,
}: {
  ref?: React.Ref<HTMLButtonElement>;
  id?: string;
  expanded: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <IconButton
      ref={ref}
      id={id}
      hover="none"
      aria-label="Menü"
      aria-expanded={expanded}
      onClick={onClick}
      className="inline-flex nav:hidden"
    >
      {children}
    </IconButton>
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
  // A click or key press pins the panel; a hover shows it while it lasts.
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  // After a close, a still-hovering pointer must leave before it reopens the panel.
  const [hoverSuppressed, setHoverSuppressed] = useState(false);
  // Set by a close that suppresses a hovering pointer (Escape, a trigger or link
  // click under it): that exit lets the pointer through to the page.
  const [passThroughExit, setPassThroughExit] = useState(false);
  const navigatingRef = useRef(false);
  const open = pinned || (hovered && !hoverSuppressed);

  const close = () => {
    setPinned(false);
    setHoverSuppressed(true);
    setPassThroughExit(hovered);
  };
  const pin = () => {
    setPinned(true);
    setHoverSuppressed(false);
    setPassThroughExit(false);
  };
  const setHover = (event: React.PointerEvent, value: boolean) => {
    // Like CSS :hover under `(hover: hover)`: mouse and pen, never touch.
    if (event.pointerType === "touch" || !matchMedia(HOVER_QUERY).matches)
      return;
    setHovered(value);
    setHoverSuppressed(false);
    if (value) setPassThroughExit(false);
  };

  return (
    <div
      data-open={open || undefined}
      onPointerEnter={(event) => setHover(event, true)}
      onPointerLeave={(event) => setHover(event, false)}
      className="group relative"
    >
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (!next) close();
        }}
      >
        <PopoverTrigger>
          <Button
            variant="ghost"
            onClick={(event) => {
              // Replace the plain toggle: a click pins a hover-opened panel.
              event.preventDefault();
              if (open && pinned) close();
              else pin();
            }}
            className={cn("px-3 nav-wide:px-3.5", activeText(active))}
          >
            Online lernen
            <ChevronDown
              className="size-3.5 transition-transform duration-quick group-data-open:rotate-180"
              aria-hidden
            />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          label="Online lernen"
          align="end"
          className="flex w-64 flex-col gap-0.5"
          // As on main, the fading panel still catches the pointer, so coming
          // back onto it turns it around; a suppressed close passes through.
          hitTestableExit={!passThroughExit}
          onCloseAutoFocus={(event) => {
            // A link click navigates: the destination owns focus.
            if (navigatingRef.current) event.preventDefault();
            navigatingRef.current = false;
          }}
        >
          {platformNav.map((item) => (
            <Button
              asChild
              key={`${item.href}:${item.label}`}
              variant="ghost"
              aria-current={currentPage(pathname, item.href)}
              onClick={() => {
                navigatingRef.current = true;
                close();
              }}
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
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * The full-screen mobile menu: a modal dialog that repeats the header row (home
 * link and close control) above the links, so all of it is one focus scope.
 */
function MobileMenu({
  open,
  onClose,
  pathname,
  platformActive,
  returnFocusRef,
  homeLinkRef,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  platformActive: boolean;
  returnFocusRef: RefObject<HTMLElement | null>;
  homeLinkRef: RefObject<HTMLElement | null>;
}) {
  const closeId = useId();
  const navigatingRef = useRef(false);
  const focusHomeRef = useRef(false);

  // A link navigates: the destination owns focus, not the menu button.
  const navigate = () => {
    navigatingRef.current = true;
    onClose();
  };
  // The home link on the home page leads nowhere new: as when the open menu
  // was part of the page header, focus stays on the (page header's) home link.
  const goHome = () => {
    if (pathname !== routes.home) return navigate();
    focusHomeRef.current = true;
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      layout="custom"
      labelledBy={closeId}
      returnFocusRef={returnFocusRef}
      fallbackFocusRef={homeLinkRef}
      onCloseAutoFocus={(event) => {
        if (focusHomeRef.current) {
          event.preventDefault();
          homeLinkRef.current?.focus({ preventScroll: true });
        } else if (navigatingRef.current) event.preventDefault();
        navigatingRef.current = false;
        focusHomeRef.current = false;
      }}
      // The open header's look: page background, and the same backdrop blur,
      // which also keeps its text rendering.
      className="flex flex-col bg-bg backdrop-blur-lg nav:hidden"
    >
      <header className="flex min-h-0 flex-1 flex-col">
        <HeaderRow onHome={goHome}>
          <MenuButton id={closeId} expanded onClick={onClose}>
            <X className="size-5" />
          </MenuButton>
        </HeaderRow>

        <MobileMenuLinks
          pathname={pathname}
          platformActive={platformActive}
          onNavigate={navigate}
        />
      </header>
    </Dialog>
  );
}

function MobileMenuLinks({
  pathname,
  platformActive,
  onNavigate,
}: {
  pathname: string;
  platformActive: boolean;
  onNavigate: () => void;
}) {
  // Unmounts with the dialog's content, so every opening starts collapsed.
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
