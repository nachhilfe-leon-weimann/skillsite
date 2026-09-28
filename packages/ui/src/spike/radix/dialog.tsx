"use client";

import * as Dialog from "@radix-ui/react-dialog";

import { Button } from "../../primitives/button";
import { cn } from "../../utils/cn";
import { look } from "../look";
import { motion } from "./motion";

export function RadixDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button>Termin anfragen</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={cn(look.overlay, motion)}>
          <Dialog.Content className={cn(look.dialog, motion)}>
            <Dialog.Title className="text-card-title font-bold text-ink">
              Termin anfragen
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-body text-ink-soft">
              Wir melden uns innerhalb eines Tages.
            </Dialog.Description>
            <label className="mt-5 block text-small font-semibold text-ink">
              Name
              <input className={cn(look.input, "mt-1.5")} name="name" />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close asChild>
                <Button variant="ghost">Abbrechen</Button>
              </Dialog.Close>
              <Dialog.Close asChild>
                <Button>Senden</Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
