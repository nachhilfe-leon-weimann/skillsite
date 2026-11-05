import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ThemeProvider } from "./theme-provider";
import { ThemeToggle } from "./theme-toggle";

const meta = {
  title: "Shell/ThemeToggle",
  component: ThemeToggle,
  // The provider owns `data-theme` here, so the toolbar's theme does not apply.
  parameters: { ownsTheme: true },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The footer's light/dark override inside the ThemeProvider, on navy. No
 * active segment follows the system; choosing the active one again returns
 * to it. The choice switches this story's theme.
 */
export const Default: Story = {
  render: () => (
    <div className="max-w-xs rounded-2xl bg-navy p-5">
      <ThemeToggle />
    </div>
  ),
};
