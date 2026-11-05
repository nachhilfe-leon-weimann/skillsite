import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Logo } from "./logo";

/** A neutral placeholder mark; the app passes its own logo from `public/`. */
const placeholderMark = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 41"><rect width="42" height="41" rx="10" fill="#e8674a"/><path d="M12 21l6 6 12-13" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
)}`;

const meta = {
  title: "Shell/Logo",
  component: Logo,
  args: {
    name: "Beispielmarke",
    tagline: "Nachhilfe online",
    src: placeholderMark,
    tone: "default",
  },
  argTypes: { tone: { control: "select", options: ["default", "inverse"] } },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Both tones (`inverse` on navy, as in the footer) and the mark alone. */
export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-6">
      <Logo {...args} tone="default" />
      <div className="rounded-2xl bg-navy p-5">
        <Logo {...args} tone="inverse" />
      </div>
      <Logo {...args} showText={false} />
    </div>
  ),
};
