import {
  DocHero,
  DocIndentBlock,
  DocSection,
  DocShell,
  DocSubSection,
} from "@/components/docs/doc-components";
import { ProseP } from "@skillsite/ui/typography/prose";
import { TextLink } from "@skillsite/ui/primitives/link";
import {
  agbContact,
  agbEffectiveDate,
  agbSectionHeading,
  agbSections,
} from "@/content/agb";
import { legalContact } from "@/content/legal";
import { pageMetadata } from "@/lib/metadata";
import { routes } from "@/lib/routes";
import { CalendarDays, Mail, ScrollText } from "lucide-react";

export const metadata = pageMetadata({
  title: "AGB",
  description:
    "Allgemeine Geschäftsbedingungen für die Nachhilfeleistungen von Nachhilfe Leon Weimann.",
  canonical: "/agb",
});

/** Section with its number and heading pulled from the central registry. */
function AgbSection({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <DocSection id={id} title={agbSectionHeading(id)}>
      {children}
    </DocSection>
  );
}

export default function AgbPage() {
  const effectiveDate = agbEffectiveDate.toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });

  return (
    <DocShell
      sections={agbSections}
      hero={
        <DocHero
          badge="Nachhilfebedingungen"
          icon={ScrollText}
          title={<>Allgemeine Geschäfts&shy;bedingungen</>}
          lead="Bedingungen für die Nachhilfeleistungen von Nachhilfe Leon Weimann."
          facts={[
            {
              icon: CalendarDays,
              label: "Stand",
              children: <>{effectiveDate}</>,
            },
            {
              icon: Mail,
              label: "Kontakt",
              children: (
                <TextLink variant="doc" href={`mailto:${agbContact.email}`}>
                  {agbContact.email}
                </TextLink>
              ),
            },
          ]}
        />
      }
    >
      <AgbSection id="geltungsbereich">
        <ProseP>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle
          Nachhilfeleistungen, die {legalContact.businessName} (Inhaber:{" "}
          {legalContact.ownerName}, im Folgenden „Anbieter“) gegenüber seinen
          Kundinnen und Kunden erbringt. Maßgeblich ist die bei Vertragsschluss
          gültige Fassung.
        </ProseP>
        <ProseP>
          Kundinnen und Kunden im Sinne dieser AGB sind Verbraucher (§ 13 BGB).
          Entgegenstehende oder abweichende Bedingungen der Kundinnen und Kunden
          werden nicht Vertragsbestandteil, es sei denn, der Anbieter stimmt
          ihrer Geltung ausdrücklich zu. Vertragssprache ist Deutsch.
        </ProseP>
      </AgbSection>

      <AgbSection id="vertragsschluss">
        <ProseP>
          Bei der kostenpflichtigen Online-Terminbuchung kommt der
          Nachhilfevertrag zustande, sobald die Buchung erfolgreich bestätigt
          wird. Bei einer individuellen Anmeldung kommt er zustande, wenn der
          Anbieter die Anmeldung bestätigt oder mit der Nachhilfe beginnt. Ein
          gesondertes schriftliches Dokument ist dafür nicht erforderlich.
        </ProseP>
        <ProseP>
          Ist die lernende Person minderjährig, kommt der Vertrag mit den
          Erziehungsberechtigten zustande. Bucht die minderjährige Person einen
          Termin selbst, bedarf der Vertrag der Zustimmung der
          Erziehungsberechtigten.
        </ProseP>
      </AgbSection>

      <AgbSection id="leistungen">
        <ProseP>
          Der Anbieter erbringt Nachhilfeunterricht ausschließlich online (z. B.
          über Microsoft Teams oder Discord) in den angebotenen Fächern. Der
          konkrete Umfang ergibt sich aus der jeweiligen Vereinbarung.
        </ProseP>
        <ProseP>
          Die Online-Nachhilfe setzt aufseiten der lernenden Person eine
          geeignete technische Ausstattung und eine stabile Internetverbindung
          voraus; hierfür ist die Kundin oder der Kunde verantwortlich.
        </ProseP>
        <ProseP>
          Der Nachhilfevertrag ist ein Dienstvertrag (§ 611 BGB). Geschuldet ist
          die fachgerechte Durchführung des Unterrichts, nicht ein bestimmter
          Lern- oder Prüfungserfolg (etwa eine bestimmte Note).
        </ProseP>
      </AgbSection>

      <AgbSection id="termine">
        <ProseP>
          Termine werden individuell vereinbart oder über die Terminbuchung
          gebucht.
        </ProseP>
        <ProseP>
          Eine Absage oder Verschiebung ist bis 24 Stunden vor dem vereinbarten
          Beginn kostenfrei möglich. Bei einer späteren Absage oder bei
          Nichterscheinen wird das vereinbarte Honorar für den Termin berechnet,
          es sei denn, die Kundin oder der Kunde weist nach, dass die Absage auf
          einem wichtigen, nicht zu vertretenden Grund beruht (z. B. Krankheit).
          Gelingt es dem Anbieter, den Termin anderweitig zu vergeben, entfällt
          die Zahlungspflicht.
        </ProseP>
        <ProseP>
          Muss der Anbieter einen Termin absagen, wird nach Möglichkeit ein
          Ersatztermin angeboten. Bereits gezahlte Beträge für nicht erbrachte
          Stunden werden erstattet.
        </ProseP>
      </AgbSection>

      <AgbSection id="preise">
        <ProseP>
          Es gelten die zum Zeitpunkt der Buchung aktuellen Preise gemäß der{" "}
          <TextLink variant="doc" href={routes.pricing}>
            Preisübersicht
          </TextLink>
          , soweit nicht im Einzelfall ausdrücklich ein abweichender Preis
          vereinbart ist. Alle Preise sind Endpreise; Umsatzsteuer wird gemäß §
          19 UStG nicht erhoben (Kleinunternehmerregelung).
        </ProseP>
        <ProseP>
          Die Abrechnung erfolgt nach Erbringung der Leistung per Rechnung.
          Rechnungen sind, soweit dort kein anderes Zahlungsziel angegeben ist,
          innerhalb von 14 Tagen ab Zugang ohne Abzug per PayPal oder
          Überweisung zu begleichen. Bei Zahlungsverzug gelten die gesetzlichen
          Regelungen.
        </ProseP>
        <ProseP>
          Bei einer Förderung über das Bildungs- und Teilhabepaket erfolgt die
          Abrechnung im bewilligten Umfang direkt mit dem zuständigen
          Kostenträger.
        </ProseP>
      </AgbSection>

      <AgbSection id="kuendigung">
        <ProseP>
          Es besteht keine Mindestlaufzeit. Das Nachhilfeverhältnis kann von
          beiden Seiten jederzeit formlos – etwa per E-Mail – beendet werden.
          Bereits verbindlich vereinbarte Termine bleiben hiervon unberührt; für
          deren Absage gilt die Regelung unter „Termine, Absage und Ausfall“.
        </ProseP>
      </AgbSection>

      <AgbSection id="widerruf">
        <ProseP>
          Verbraucher haben bei Verträgen, die im Fernabsatz (z. B. online)
          geschlossen werden, ein Widerrufsrecht.
        </ProseP>
        <DocSubSection title="Widerrufsbelehrung">
          <ProseP>
            Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen
            diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn
            Tage ab dem Tag des Vertragsschlusses.
          </ProseP>
          <ProseP>
            Um Ihr Widerrufsrecht auszuüben, müssen Sie den Anbieter (
            {legalContact.businessName}, {legalContact.street},{" "}
            {legalContact.city}; E-Mail:{" "}
            <TextLink variant="doc" href={`mailto:${agbContact.email}`}>
              {agbContact.email}
            </TextLink>
            ) mittels einer eindeutigen Erklärung (z. B. per E-Mail) über Ihren
            Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können
            dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch
            nicht vorgeschrieben ist. Zur Wahrung der Widerrufsfrist genügt die
            rechtzeitige Absendung der Mitteilung.
          </ProseP>
        </DocSubSection>
        <DocSubSection title="Folgen des Widerrufs">
          <ProseP>
            Wenn Sie diesen Vertrag widerrufen, hat der Anbieter Ihnen alle
            Zahlungen, die er von Ihnen erhalten hat, unverzüglich und
            spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem
            die Mitteilung über Ihren Widerruf beim Anbieter eingegangen ist.
            Für die Rückzahlung wird dasselbe Zahlungsmittel verwendet, das Sie
            bei der ursprünglichen Transaktion eingesetzt haben, es sei denn,
            mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem
            Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.
          </ProseP>
          <ProseP>
            Haben Sie verlangt, dass die Nachhilfe während der Widerrufsfrist
            beginnen soll, so haben Sie dem Anbieter einen angemessenen Betrag
            zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie den
            Anbieter von der Ausübung des Widerrufsrechts unterrichten, bereits
            erbrachten Leistungen im Vergleich zum Gesamtumfang der im Vertrag
            vorgesehenen Leistungen entspricht.
          </ProseP>
        </DocSubSection>
        <DocSubSection title="Erlöschen des Widerrufsrechts">
          <ProseP>
            Das Widerrufsrecht erlischt, wenn der Anbieter die Dienstleistung
            vollständig erbracht hat und mit der Ausführung erst begonnen hat,
            nachdem Sie dazu Ihre ausdrückliche Zustimmung gegeben und
            gleichzeitig Ihre Kenntnis davon bestätigt haben, dass Sie Ihr
            Widerrufsrecht bei vollständiger Vertragserfüllung durch den
            Anbieter verlieren.
          </ProseP>
        </DocSubSection>
        <DocSubSection title="Muster-Widerrufsformular">
          <ProseP>
            Wenn Sie den Vertrag widerrufen wollen, können Sie dieses Formular
            ausfüllen und an den Anbieter zurücksenden:
          </ProseP>
          <DocIndentBlock
            lines={[
              `An ${legalContact.businessName}, ${legalContact.street}, ${legalContact.city}, E-Mail: ${agbContact.email}:`,
              "Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung: …",
              "Bestellt am (*)/erhalten am (*)",
              "Name des/der Verbraucher(s)",
              "Anschrift des/der Verbraucher(s)",
              "Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)",
              "Datum",
            ]}
            footnote="(*) Unzutreffendes streichen."
          />
        </DocSubSection>
      </AgbSection>

      <AgbSection id="haftung">
        <ProseP>
          Der Anbieter haftet unbeschränkt für Schäden aus der Verletzung des
          Lebens, des Körpers oder der Gesundheit sowie für Schäden, die auf
          Vorsatz oder grober Fahrlässigkeit beruhen.
        </ProseP>
        <ProseP>
          Bei einfacher Fahrlässigkeit haftet der Anbieter nur für die
          Verletzung einer wesentlichen Vertragspflicht (Pflicht, deren
          Erfüllung die ordnungsgemäße Durchführung des Vertrags überhaupt erst
          ermöglicht und auf deren Einhaltung die Kundin oder der Kunde
          regelmäßig vertraut). In diesem Fall ist die Haftung auf den
          vertragstypischen, vorhersehbaren Schaden begrenzt.
        </ProseP>
        <ProseP>
          Für einen bestimmten Lern- oder Prüfungserfolg übernimmt der Anbieter
          keine Haftung.
        </ProseP>
      </AgbSection>

      <AgbSection id="schluss">
        <ProseP>Es gilt das Recht der Bundesrepublik Deutschland.</ProseP>
        <ProseP>
          Der Anbieter ist nicht bereit und nicht verpflichtet, an
          Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
          teilzunehmen.
        </ProseP>
        <ProseP>
          Sollte eine Bestimmung dieser AGB unwirksam sein oder werden, bleibt
          die Wirksamkeit der übrigen Bestimmungen unberührt.
        </ProseP>
      </AgbSection>
    </DocShell>
  );
}
