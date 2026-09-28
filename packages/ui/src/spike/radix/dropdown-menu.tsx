"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";

import { cn } from "../../utils/cn";
import { look } from "../look";
import { motion } from "./motion";

const items = ["Discord", "Microsoft Teams", "Vor Ort"];

export function RadixDropdownMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className={look.trigger}>
        Online lernen <ChevronDown aria-hidden className="size-4" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="start"
          className={cn(look.panel, motion)}
        >
          {items.map((item) => (
            <DropdownMenu.Item
              key={item}
              className={cn(
                look.item,
                "data-highlighted:bg-surface-2 data-highlighted:text-ink",
              )}
            >
              {item}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
