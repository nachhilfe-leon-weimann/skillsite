import {
  DocIndentBlock,
  DocSection,
  DocSubSection,
} from "@/components/docs/doc-components";
import { ProseP } from "@skillsite/ui/typography/prose";
import { TextLink } from "@skillsite/ui/primitives/link";
import { agbContact, agbSections } from "@/content/agb";
import { legalContact } from "@/content/legal-contact";
import { routes } from "@/lib/routes";

/** /agb around its prose: metadata and hero. */
export const agbPage = {
  metadata: {
    title: "AGB",
    description:
      "Allgemeine Geschäftsbedingungen für die Nachhilfeleistungen von Nachhilfe Leon Weimann.",
  },
  hero: {
    badge: "Nachhilfebedingungen",
    title: <>Allgemeine Geschäfts&shy;bedingungen</>,
    lead: "Bedingungen für die Nachhilfeleistungen von Nachhilfe Leon Weimann.",
    facts: {
      effectiveDate: "Stand",
      contact: "Kontakt",
    },
  },
};

/** Section with its number and heading pulled from the central registry. */
function AgbSection({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <DocSection id={id} title={agbSections.heading(id)}>
      {children}
    </DocSection>
  );
}

/** Names a section in running text by its number and title, e.g. `Abschnitt 4 („Termine …“)`. */
const sectionRef = (id: string) => {
  const section = agbSections.sections.find((entry) => entry.id === id);
  return `Abschnitt ${agbSections.number(id)} („${section?.title ?? ""}“)`;
};

/** The AGB's sections, in order, as /agb renders them. */
export function AgbProse() {
  return (
    <>
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
          Vertragssprache ist Deutsch.
        </ProseP>
      </AgbSection>

      <AgbSection id="vertragsschluss">
        <ProseP>
          Ist die lernende Person minderjährig, ist Vertragspartner ein
          sorgeberechtigter Elternteil oder ein anderer gesetzlicher Vertreter,
          der den Vertrag im eigenen Namen schließt. Volljährige lernende
          Personen schließen den Vertrag selbst, sofern nicht eine andere Person
          ihn im eigenen Namen schließt. Diese Person ist die Kundin oder der
          Kunde.
        </ProseP>
        <ProseP>
          Die Zusammenarbeit beginnt mit einem kostenlosen und unverbindlichen
          Erstgespräch. Danach sendet der Anbieter der Kundin oder dem Kunden
          die Eckdaten der Nachhilfe (Nachhilfevereinbarung) zusammen mit diesen
          AGB, der Widerrufsbelehrung und dem Muster-Widerrufsformular per
          E-Mail. Die Nachhilfevereinbarung kommt zustande, wenn die Kundin oder
          der Kunde ihr in Textform (z. B. per E-Mail) zustimmt. Sie ist ein
          Rahmenvertrag: Die einzelnen Termine werden innerhalb dieses Rahmens
          individuell vereinbart oder über die Online-Terminbuchung gebucht.
        </ProseP>
        <ProseP>
          Bei der Online-Terminbuchung wählt die Kundin oder der Kunde Termin,
          Dauer und Fach und gibt die erforderlichen Daten ein. Vor dem Absenden
          lassen sich alle Eingaben im Formular prüfen und korrigieren; über
          „Zurück“ lässt sich auch der Termin neu wählen. Mit Klick auf
          „Zahlungspflichtig buchen“ gibt die Kundin oder der Kunde ein
          verbindliches Angebot über den gewählten Termin ab. Der Vertrag über
          den Termin kommt zustande, wenn der Anbieter die Buchung per E-Mail
          bestätigt. Diese AGB sind jederzeit unter dieser Adresse abrufbar und
          können gespeichert oder ausgedruckt werden; einen gesonderten Zugriff
          auf den Vertragstext bietet der Anbieter nicht an.
        </ProseP>
        <ProseP>
          Bucht eine minderjährige lernende Person Termine selbst, handelt sie
          im Namen der Kundin oder des Kunden. Dafür müssen die
          Sorgeberechtigten zugestimmt haben, in der Regel in der
          Nachhilfevereinbarung. Ohne diese Zustimmung kommt der Vertrag über
          den Termin erst zustande, wenn die Sorgeberechtigten ihn genehmigen.
        </ProseP>
      </AgbSection>

      <AgbSection id="leistungen">
        <ProseP>
          Der Anbieter erteilt Nachhilfeunterricht ausschließlich online in den
          angebotenen Fächern, über Microsoft Teams oder Discord. Discord setzt
          voraus, dass die Person, deren Konto genutzt wird, das Mindestalter
          nach den Nutzungsbedingungen von Discord erreicht hat; sonst findet
          der Unterricht über Microsoft Teams statt.
        </ProseP>
        <ProseP>
          Der Umfang ergibt sich aus der Nachhilfevereinbarung und den gebuchten
          Terminen. Notizen und Materialien zum Termin sind im Preis enthalten.
          Kurze Fragen zwischen den Terminen beantwortet der Anbieter nach
          Möglichkeit ohne zusätzliche Kosten. Materialien und Notizen des
          Anbieters sind für das eigene Lernen bestimmt und dürfen nicht
          veröffentlicht oder weiterverkauft werden.
        </ProseP>
        <ProseP>
          Der Anbieter zeichnet den Unterricht nicht auf. Auch der Kundin oder
          dem Kunden und der lernenden Person ist es nicht gestattet, den
          Unterricht in Bild oder Ton aufzuzeichnen.
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
          Termine werden individuell vereinbart oder über die
          Online-Terminbuchung gebucht. Eine Absage oder Verschiebung ist bis 24
          Stunden vor dem vereinbarten Beginn kostenfrei möglich, in Textform
          (z. B. per E-Mail oder Messenger-Nachricht) oder über die
          Absagefunktion in der Terminbestätigung. Maßgeblich ist der Zeitpunkt,
          zu dem die Absage beim Anbieter eingeht.
        </ProseP>
        <ProseP>
          Bei einer späteren Absage oder wenn die lernende Person nicht
          erscheint, bleibt das vereinbarte Honorar für den Termin geschuldet
          (Ausfallhonorar). Vergibt der Anbieter den Termin anderweitig,
          entfällt das Ausfallhonorar. Die Kundin oder der Kunde kann
          nachweisen, dass der Anbieter durch den Ausfall Aufwendungen erspart
          oder anderweitig etwas erworben hat; das Ausfallhonorar ermäßigt sich
          dann entsprechend.
        </ProseP>
        <ProseP>
          Kein Ausfallhonorar wird berechnet, wenn die lernende Person plötzlich
          erkrankt oder ein vergleichbarer, nicht vorhersehbarer Notfall
          eintritt und der Termin unverzüglich abgesagt wird. Ein ärztliches
          Attest ist dafür nicht erforderlich.
        </ProseP>
        <ProseP>
          Erscheint die lernende Person verspätet, endet der Termin zur
          vereinbarten Zeit, und es wird die vereinbarte Dauer berechnet.
          Verspätet sich der Anbieter oder fällt Unterricht wegen einer
          technischen Störung ganz oder teilweise aus, wird die ausgefallene
          Zeit nachgeholt oder nicht berechnet.
        </ProseP>
        <ProseP>
          Der Anbieter sagt einen Termin nur aus wichtigem Grund ab, etwa bei
          Krankheit, einer technischen Störung oder höherer Gewalt, und teilt
          dies unverzüglich mit. Er bietet nach Möglichkeit einen Ersatztermin
          an; die Kundin oder der Kunde kann ihn annehmen oder den Termin ohne
          Kosten entfallen lassen. Für den Termin vorausgezahlte Beträge werden
          verrechnet oder erstattet.
        </ProseP>
        <ProseP>
          Das gesetzliche Widerrufsrecht ({sectionRef("widerruf")}) bleibt von
          diesen Regeln unberührt.
        </ProseP>
      </AgbSection>

      <AgbSection id="preise">
        <ProseP>
          Es gelten die Preise der{" "}
          <TextLink variant="doc" href={routes.pricing}>
            Preisübersicht
          </TextLink>{" "}
          zum Zeitpunkt der Buchung oder Vereinbarung des Termins, soweit nicht
          im Einzelfall ausdrücklich ein abweichender Preis vereinbart ist. Der
          Preis für 60 Minuten gilt für andere Dauern anteilig (z. B. 45 oder 90
          Minuten). Alle Preise sind Endpreise; als Kleinunternehmer im Sinne
          von § 19 UStG berechnet der Anbieter keine Umsatzsteuer.
        </ProseP>
        <ProseP>
          Neue Preise gelten nur für Termine, die nach der Änderung gebucht oder
          vereinbart werden. Der Anbieter kündigt eine Preisänderung bestehenden
          Kundinnen und Kunden mindestens vier Wochen vorher in Textform an.
        </ProseP>
        <ProseP>
          Die Abrechnung erfolgt nach Erbringung der Leistung per Rechnung,
          einzeln oder gesammelt für mehrere Termine. Rechnungen sind, soweit
          dort kein anderes Zahlungsziel angegeben ist, innerhalb von 14 Tagen
          ab Zugang ohne Abzug per PayPal oder Überweisung zu begleichen. Bei
          Zahlungsverzug gelten die gesetzlichen Regelungen.
        </ProseP>
        <ProseP>
          Wird im Einzelfall eine Vorauszahlung vereinbart, verrechnet der
          Anbieter sie mit den erbrachten Stunden und etwaigen Ausfallhonoraren
          und teilt den Stand auf Nachfrage mit. Ein Guthaben verfällt nicht.
          Endet die Zusammenarbeit, erstattet der Anbieter ein verbleibendes
          Guthaben innerhalb von 14 Tagen.
        </ProseP>
        <ProseP>
          Bei einer Förderung über das Bildungs- und Teilhabepaket rechnet der
          Anbieter im bewilligten Umfang direkt mit dem zuständigen Kostenträger
          ab. Stunden über den bewilligten Umfang hinaus und Ausfallhonorare,
          die der Kostenträger nicht übernimmt, trägt die Kundin oder der Kunde.
        </ProseP>
      </AgbSection>

      <AgbSection id="kuendigung">
        <ProseP>
          Es besteht keine Mindestlaufzeit. Beide Seiten können die
          Zusammenarbeit jederzeit in Textform – etwa per E-Mail – beenden.
          Bereits gebuchte Termine bleiben bestehen, soweit sie nicht nach{" "}
          {sectionRef("termine")} abgesagt werden. Gesetzliche Kündigungsrechte
          bleiben unberührt.
        </ProseP>
      </AgbSection>

      <AgbSection id="widerruf">
        <ProseP>
          Verbraucherinnen und Verbrauchern steht bei Verträgen, die im
          Fernabsatz (z. B. per E-Mail, Telefon, Videoanruf oder online)
          geschlossen werden, ein Widerrufsrecht nach Maßgabe der folgenden
          Widerrufsbelehrung zu.
        </ProseP>
        <DocSubSection title="Widerrufsbelehrung">
          <ProseP>
            <strong>Widerrufsrecht</strong>
          </ProseP>
          <ProseP>
            Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen
            diesen Vertrag zu widerrufen.
          </ProseP>
          <ProseP>
            Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des
            Vertragsabschlusses.
          </ProseP>
          <ProseP>
            Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (
            {legalContact.businessName}, {legalContact.street},{" "}
            {legalContact.city}, Telefon: {agbContact.phone}, E-Mail:{" "}
            <TextLink variant="doc" href={`mailto:${agbContact.email}`}>
              {agbContact.email}
            </TextLink>
            ) mittels einer eindeutigen Erklärung (z. B. ein mit der Post
            versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag
            zu widerrufen, informieren. Sie können dafür das beigefügte
            Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben
            ist.
          </ProseP>
          <ProseP>
            Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die
            Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der
            Widerrufsfrist absenden.
          </ProseP>
          <ProseP>
            <strong>Folgen des Widerrufs</strong>
          </ProseP>
          <ProseP>
            Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen,
            die wir von Ihnen erhalten haben, einschließlich der Lieferkosten
            (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass
            Sie eine andere Art der Lieferung als die von uns angebotene,
            günstigste Standardlieferung gewählt haben), unverzüglich und
            spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem
            die Mitteilung über Ihren Widerruf dieses Vertrags bei uns
            eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe
            Zahlungsmittel, das Sie bei der ursprünglichen Transaktion
            eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas
            anderes vereinbart; in keinem Fall werden Ihnen wegen dieser
            Rückzahlung Entgelte berechnet.
          </ProseP>
          <ProseP>
            Haben Sie verlangt, dass die Dienstleistungen während der
            Widerrufsfrist beginnen soll, so haben Sie uns einen angemessenen
            Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem
            Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses
            Vertrags unterrichten, bereits erbrachten Dienstleistungen im
            Vergleich zum Gesamtumfang der im Vertrag vorgesehenen
            Dienstleistungen entspricht.
          </ProseP>
        </DocSubSection>
        <DocSubSection title="Erlöschen des Widerrufsrechts">
          <ProseP>
            Das Widerrufsrecht erlischt bei einem Vertrag über Dienstleistungen,
            wenn der Anbieter die Dienstleistung vollständig erbracht hat und
            mit der Ausführung erst begonnen hat, nachdem Sie dazu Ihre
            ausdrückliche Zustimmung gegeben und gleichzeitig Ihre Kenntnis
            davon bestätigt haben, dass Sie Ihr Widerrufsrecht bei vollständiger
            Vertragserfüllung durch den Anbieter verlieren.
          </ProseP>
        </DocSubSection>
        <DocSubSection title="Muster-Widerrufsformular">
          <ProseP>
            (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte
            dieses Formular aus und senden Sie es zurück.)
          </ProseP>
          <DocIndentBlock
            lines={[
              `– An ${legalContact.businessName}, ${legalContact.street}, ${legalContact.city}, E-Mail: ${agbContact.email}:`,
              "– Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung (*)",
              "– Bestellt am (*)/erhalten am (*)",
              "– Name des/der Verbraucher(s)",
              "– Anschrift des/der Verbraucher(s)",
              "– Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)",
              "– Datum",
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
      </AgbSection>

      <AgbSection id="schluss">
        <ProseP>
          Es gilt das Recht der Bundesrepublik Deutschland. Hat eine
          Verbraucherin oder ein Verbraucher den gewöhnlichen Aufenthalt in
          einem anderen Staat, bleiben die zwingenden
          Verbraucherschutzvorschriften dieses Staates unberührt.
        </ProseP>
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
    </>
  );
}
