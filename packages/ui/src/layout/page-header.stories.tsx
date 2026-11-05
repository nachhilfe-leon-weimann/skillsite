import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PageHeader } from "./page-header";
import { Button } from "../primitives/button";

const meta = {
  title: "Layout/PageHeader",
  component: PageHeader,
  parameters: { layout: "fullscreen" },
  args: {
    eyebrow: "Fächer",
    title: "Mathe endlich verstehen",
    lead: "Einzelunterricht, der sich nach dir richtet: verständlich, strukturiert und mit Geduld erklärt.",
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const actions = (
  <>
    <Button>Termin buchen</Button>
    <Button variant="outline">Preise ansehen</Button>
  </>
);

/** A route's intro: the h1 in a Container, revealed on mount. */
export const Page: Story = {
  render: (args) => <PageHeader {...args}>{actions}</PageHeader>,
};

/** Centred, with actions. */
export const PageCentered: Story = {
  render: (args) => (
    <PageHeader {...args} align="center">
      {actions}
    </PageHeader>
  ),
};

/**
 * A section intro: an h2, revealed when it scrolls into view, left and
 * centred, and with only a title.
 */
export const Section: Story = {
  render: (args) => (
    <div className="flex flex-col gap-12 px-6 py-10">
      <PageHeader {...args} variant="section" />
      <PageHeader {...args} variant="section" align="center">
        {actions}
      </PageHeader>
      <PageHeader variant="section" title="Nur ein Titel" />
    </div>
  ),
};

/** Every title size: `display`, `h1` (a page's default), `h2` (a section's default), `h3`. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-10 px-6 py-10">
      {(["display", "h1", "h2", "h3"] as const).map((size) => (
        <PageHeader
          key={size}
          {...args}
          variant="section"
          size={size}
          eyebrow={size}
        />
      ))}
    </div>
  ),
};
