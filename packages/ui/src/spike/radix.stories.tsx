import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RadixCombobox } from "./radix/combobox";
import { RadixDatePicker } from "./radix/date-picker";
import { RadixDialog } from "./radix/dialog";
import { RadixDropdownMenu } from "./radix/dropdown-menu";
import { RadixRadioGroup } from "./radix/radio-group";

/** Spike only (C7): Radix Primitives in the brand look. Thrown away after the gate. */
const meta = { title: "Spike/Radix" } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dialog: Story = { render: () => <RadixDialog /> };
export const DropdownMenu: Story = { render: () => <RadixDropdownMenu /> };
export const RadioGroup: Story = { render: () => <RadixRadioGroup /> };
export const Combobox: Story = { render: () => <RadixCombobox /> };
export const DatePicker: Story = { render: () => <RadixDatePicker /> };
