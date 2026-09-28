"use client";

import { ChevronDown } from "lucide-react";
import {
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
} from "react-aria-components";

import { cn } from "../../utils/cn";
import { look } from "../look";
import { motion } from "./motion";

const items = ["Discord", "Microsoft Teams", "Vor Ort"];

export function RacDropdownMenu() {
  return (
    <MenuTrigger>
      <Button className={look.trigger}>
        Online lernen <ChevronDown aria-hidden className="size-4" />
      </Button>
      <Popover
        offset={8}
        placement="bottom start"
        className={cn(look.panel, motion)}
      >
        <Menu className="outline-none">
          {items.map((item) => (
            <MenuItem
              key={item}
              id={item}
              className={cn(
                look.item,
                "data-focused:bg-surface-2 data-focused:text-ink",
              )}
            >
              {item}
            </MenuItem>
          ))}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}
