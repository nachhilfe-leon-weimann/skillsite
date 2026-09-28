import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RacCombobox } from "./rac/combobox";
import { RacDatePicker } from "./rac/date-picker";
import { RacDialog } from "./rac/dialog";
import { RacDropdownMenu } from "./rac/dropdown-menu";
import { RacRadioGroup } from "./rac/radio-group";

/** Spike only (C7): React Aria Components in the brand look. Thrown away after the gate. */
const meta = { title: "Spike/React Aria" } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dialog: Story = { render: () => <RacDialog /> };
export const DropdownMenu: Story = { render: () => <RacDropdownMenu /> };
export const RadioGroup: Story = { render: () => <RacRadioGroup /> };
export const Combobox: Story = { render: () => <RacCombobox /> };
export const DatePicker: Story = { render: () => <RacDatePicker /> };
