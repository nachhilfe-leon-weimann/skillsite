"use client";

import { BadgeEuro, Clock, Phone, Video } from "lucide-react";

import { Card } from "@skillsite/ui/primitives/card";
import { InfoRow } from "@skillsite/ui/primitives/info-row";
import { Select } from "@skillsite/ui/forms/select";
import { Eyebrow } from "@skillsite/ui/typography/eyebrow";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { bookerText } from "@/content/booking";
import { bookingEvents, type BookingEventKey } from "../model/config";
import { slotDetailsLine } from "../model/order-summary";
import { durationLabel, formatSlotPrice } from "../model/pricing";

type BookerAsideProps = {
  event: BookingEventKey;
  title: string;
  subtitle: string;
  /** Minutes; selectable for variable-length events. */
  duration: number;
  onDurationChange: (duration: number) => void;
  /** Set while a slot is chosen: the duration is part of it. */
  durationLocked: boolean;
  /** The chosen slot, shown with its price; `null` hides it. */
  summary: string | null;
  /** The form's chosen summary labels (e.g. the subject), shown with a paid slot. */
  choices: string[];
};

/**
 * The booker's navy side panel: the event, how it happens, its price and
 * length, and the chosen slot; a paid slot with the form's choices, its
 * length, price and payment.
 */
export function BookerAside({
  event,
  title,
  subtitle,
  duration,
  onDurationChange,
  durationLocked,
  summary,
  choices,
}: BookerAsideProps) {
  const config = bookingEvents[event];
  const price = formatSlotPrice(config, duration);

  return (
    <aside className="flex flex-col bg-navy p-panel-booker text-on-navy">
      <Eyebrow tone="inverse-accent">{bookerText.aside.eyebrow}</Eyebrow>
      <Heading as="h2" size="h4" className="mt-3.5 text-white">
        {title}
      </Heading>
      <Text size="small" tone="inverse-soft" className="mt-1 mb-5">
        {subtitle}
      </Text>

      <div className="flex flex-col gap-3">
        <InfoRow
          icon={
            config.medium === "phone" ? (
              <Phone className="size-4" aria-hidden />
            ) : (
              <Video className="size-4" aria-hidden />
            )
          }
        >
          {config.mediumLabel}
        </InfoRow>
        <InfoRow icon={<BadgeEuro className="size-4" aria-hidden />}>
          {config.priceLabel}
        </InfoRow>
        {config.durations ? (
          <Select
            label={bookerText.durationLabel}
            hideLabel
            tone="inverse"
            icon={<Clock className="size-4" aria-hidden />}
            value={duration}
            onChange={onDurationChange}
            disabled={durationLocked}
            options={config.durations.map((value) => ({
              value,
              label: bookerText.minutes(value),
            }))}
          />
        ) : (
          <InfoRow icon={<Clock className="size-4" aria-hidden />}>
            {durationLabel(config, duration)}
          </InfoRow>
        )}
      </div>

      {summary ? (
        <Card surface="glass" className="mt-6 p-4">
          <Eyebrow as="p" dot={false} tone="inverse-accent">
            {bookerText.aside.summaryEyebrow}
          </Eyebrow>
          <p className="mt-1.5 font-heading font-bold text-white">{summary}</p>
          {price ? (
            <>
              <Text size="small" tone="inverse-soft" className="mt-1">
                {slotDetailsLine(event, { choices, duration })}
              </Text>
              <p className="mt-1 text-small font-semibold text-on-navy-soft">
                {price}
              </p>
              <Text
                size="caption"
                tone="inherit"
                className="mt-1 text-on-navy-muted"
              >
                {bookerText.aside.payment}
              </Text>
            </>
          ) : null}
        </Card>
      ) : null}

      {event === "nachhilfe" ? (
        <Text
          size="caption"
          tone="inherit"
          className="mt-auto pt-6 text-on-navy-muted"
        >
          {bookerText.aside.cancellationNote}
        </Text>
      ) : null}
    </aside>
  );
}
