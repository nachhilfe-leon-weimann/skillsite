"use client";

import { useId } from "react";
import {
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
  Pressable,
  Text,
} from "react-aria-components";

import { Button } from "../../primitives/button";
import { cn } from "../../utils/cn";
import { look } from "../look";
import { motion } from "./motion";

export function RacDialog() {
  const descriptionId = useId();
  return (
    <DialogTrigger>
      {/* Pressable hands RAC's press events to the C2 Button (a host <button>). */}
      <Pressable>
        <Button>Termin anfragen</Button>
      </Pressable>
      <ModalOverlay isDismissable className={cn(look.overlay, motion)}>
        <Modal className={cn(look.dialog, motion)}>
          {/* The description slot links itself only for role="alertdialog". */}
          <Dialog aria-describedby={descriptionId} className="outline-none">
            {({ close }) => (
              <>
                <Heading
                  slot="title"
                  className="text-card-title font-bold text-ink"
                >
                  Termin anfragen
                </Heading>
                <Text
                  id={descriptionId}
                  slot="description"
                  elementType="p"
                  className="mt-2 text-body text-ink-soft"
                >
                  Wir melden uns innerhalb eines Tages.
                </Text>
                <label className="mt-5 block text-small font-semibold text-ink">
                  Name
                  <input className={cn(look.input, "mt-1.5")} name="name" />
                </label>
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="ghost" onClick={close}>
                    Abbrechen
                  </Button>
                  <Button onClick={close}>Senden</Button>
                </div>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}
