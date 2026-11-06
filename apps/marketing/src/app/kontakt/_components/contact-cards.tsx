import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Split } from "@skillsite/ui/layout/split";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Card } from "@skillsite/ui/primitives/card";
import { SmartLink } from "@skillsite/ui/primitives/link";
import { Pill } from "@skillsite/ui/primitives/pill";
import { Eyebrow } from "@skillsite/ui/typography/eyebrow";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { contactDetails, contactPage } from "@/content/contact";
import { routes } from "@/lib/routes";

import { WhatsappQr } from "./whatsapp-qr";

const sideCardClass = "flex flex-1 flex-col justify-center p-6";

/** The contact ways of /kontakt: WhatsApp large, e-mail and the classroom beside it. */
export function ContactCards() {
  const { whatsapp, eMail, classroom } = contactPage;
  return (
    <Split align="stretch" gap="5" ratio="1.25/1">
      <Reveal variant="rise-soft" index={0}>
        <Card
          asChild
          tone="accent"
          lift="sm"
          className="flex h-full flex-col justify-center overflow-hidden p-panel-contact shadow-glow-md"
        >
          <SmartLink href={contactDetails.whatsapp.href}>
            <Eyebrow dot={false} tone="on-accent">
              {whatsapp.eyebrow}
            </Eyebrow>
            <Heading size="h3" className="mt-2.5 mb-1.5">
              {whatsapp.title}
            </Heading>
            <Text
              size="lead"
              tone="inherit"
              className="max-w-measure-24 text-on-accent-90"
            >
              {whatsapp.text}
            </Text>
            <Pill
              tone="on-accent"
              size="md"
              className="mt-6 inline-flex w-fit items-center gap-2"
            >
              {/* Label and space in one text node: split, the label can shape wider. */}
              {`${whatsapp.action} `}
              <ArrowRight className="size-4" />
            </Pill>
            <div className="mt-7 hidden items-center gap-4 sm:flex">
              <WhatsappQr value={contactDetails.whatsapp.href} />
              <Text
                size="small"
                tone="inherit"
                className="max-w-measure-12 text-on-accent-85"
              >
                {whatsapp.qrNote}
              </Text>
            </div>
          </SmartLink>
        </Card>
      </Reveal>

      <Reveal variant="rise-soft" index={1} className="flex flex-col gap-5">
        <Card asChild lift="sm" className={sideCardClass}>
          <SmartLink href={contactDetails.eMail.href}>
            <Eyebrow dot={false}>{eMail.eyebrow}</Eyebrow>
            <Heading as="h2" size="title" className="mt-2 mb-1 wrap-break-word">
              {contactDetails.eMail.content}
            </Heading>
            <Text size="small" tone="muted">
              {eMail.text}
            </Text>
          </SmartLink>
        </Card>
        <Card asChild lift="sm" className={sideCardClass}>
          <Link href={routes.onlineLearning}>
            <Eyebrow dot={false}>{classroom.eyebrow}</Eyebrow>
            <Heading as="h2" size="title" className="mt-2 mb-1">
              {classroom.title}
            </Heading>
            <Text
              size="small"
              tone="muted"
              className="inline-flex items-center gap-1.5"
            >
              {classroom.text} <ArrowRight className="size-4" />
            </Text>
          </Link>
        </Card>
      </Reveal>
    </Split>
  );
}
