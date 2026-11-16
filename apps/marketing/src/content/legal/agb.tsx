import {
  DocIndentBlock,
  DocSection,
  DocSubSection,
} from "@/components/docs/doc-components";
import { ProseP } from "@skillsite/ui/typography/prose";
import { TextLink } from "@skillsite/ui/primitives/link";
import { agbContact, agbSections } from "@/content/agb";
import { legalContact } from "@/content/legal-contact";
import { SITE_URL, routes } from "@/lib/routes";

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
function sectionRef(id: string) {
  const section = agbSections.sections.find((entry) => entry.id === id);
  if (!section) throw new Error(`Unknown AGB section: ${id}`);
  return `Abschnitt ${agbSections.number(id)} („${section.title}“)`;
}

/** The provider's postal address as the withdrawal notice names it. */
const postalAddress = `${legalContact.businessName}, ${legalContact.street}, ${legalContact.city}, ${legalContact.country}`;

/** The AGB's address without the scheme, as printed in running text. */
const agbAddress = `${SITE_URL.replace(/^https:\/\//, "")}${routes.agb}`;

/** The withdrawal function's address, as Gestaltungshinweis [3] of Anlage 1 EGBGB asks for it. */
const withdrawalFunctionAddress = `${SITE_URL.replace(/^https:\/\//, "")}${routes.withdrawalFunction}`;

/** The AGB's sections, in order, as /agb renders them. */
export function AgbProse() {
  return (
    <>
      <AgbSection id="geltungsbereich">
        <ProseP>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle
          Nachhilfeleistungen, die {legalContact.businessName} (Inhaber:{" "}
          {legalContact.ownerName}, im Folgenden „Anbieter“) gegenüber seinen
          Kundinnen und Kunden erbringt. Maßgeblich ist die Fassung, die mit der
          Nachhilfevereinbarung übermittelt wurde; für online gebuchte Termine
          die Fassung, auf die bei der Buchung hingewiesen wird. Für individuell
          vereinbarte Termine gilt eine spätere Fassung erst, wenn die Kundin
          oder der Kunde ihr in Textform zustimmt.
        </ProseP>
        <ProseP>
          Kundinnen und Kunden im Sinne dieser AGB sind Verbraucherinnen und
          Verbraucher (§ 13 BGB). Vertragssprache ist Deutsch.
        </ProseP>
      </AgbSection>

      <AgbSection id="vertragsschluss">
        <ProseP>
          Ist die lernende Person minderjährig, ist Vertragspartner ein
          sorgeberechtigter Elternteil oder ein anderer gesetzlicher Vertreter,
          der den Vertrag im eigenen Namen schließt. Volljährige lernende
          Personen schließen den Vertrag selbst, sofern nicht eine andere Person
          ihn im eigenen Namen schließt. Wer den Vertrag schließt, ist die
          Kundin oder der Kunde.
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
          Jeder Termin ist ein eigener Vertrag zu den Bedingungen der
          Nachhilfevereinbarung und dieser AGB. Ein individuell vereinbarter
          Termin kommt zustande, wenn der Anbieter ihn in Textform (z. B. per
          E-Mail oder Messenger-Nachricht) bestätigt.
        </ProseP>
        <ProseP>
          Bei der Online-Terminbuchung wählt die Kundin oder der Kunde Termin
          und Dauer, gibt die erforderlichen Daten ein und wählt Plattform und
          Fach. Vor dem Absenden lassen sich alle Eingaben im Formular prüfen
          und korrigieren; über den Pfeil neben „Deine Daten“ lässt sich auch
          der Termin neu wählen. Mit Klick auf „Zahlungspflichtig buchen“ gibt
          die Kundin oder der Kunde ein verbindliches Angebot über den gewählten
          Termin ab. Der Vertrag über den Termin kommt zustande, wenn der
          Anbieter die Buchung bestätigt; die Bestätigung erscheint direkt nach
          dem Absenden auf der Seite und kommt zusätzlich per E-Mail. Der
          Anbieter speichert die Buchung einschließlich der einbezogenen Fassung
          dieser AGB; die Angaben zum Termin erhält die Kundin oder der Kunde
          mit der Bestätigung per E-Mail, einen weiteren Zugriff auf den
          Vertragstext bietet der Anbieter nicht an. Diese AGB sind unter{" "}
          {agbAddress} abrufbar und können gespeichert oder ausgedruckt werden.
        </ProseP>
        <ProseP>
          Bucht oder vereinbart eine minderjährige lernende Person Termine
          selbst, handelt sie als Vertreterin oder Vertreter im Namen der Kundin
          oder des Kunden. Dafür muss die Kundin oder der Kunde sie
          bevollmächtigt haben, in der Regel in der Nachhilfevereinbarung. Ohne
          Vollmacht kommt der Vertrag über den Termin erst zustande, wenn die
          Kundin oder der Kunde ihn genehmigt.
        </ProseP>
      </AgbSection>

      <AgbSection id="leistungen">
        <ProseP>
          Der Anbieter erteilt Nachhilfeunterricht ausschließlich online und
          live, also in Echtzeit per Video- oder Sprachverbindung über Microsoft
          Teams oder Discord, in den angebotenen Fächern. Discord setzt voraus,
          dass die Person, deren Konto genutzt wird, das Mindestalter nach den
          Nutzungsbedingungen von Discord erreicht hat; sonst findet der
          Unterricht über Microsoft Teams statt.
        </ProseP>
        <ProseP>
          Der Umfang ergibt sich aus der Nachhilfevereinbarung und den
          vereinbarten Terminen. Notizen und Materialien ergänzen den
          Live-Unterricht und sind im Preis enthalten. Kurze Fragen zwischen den
          Terminen beantwortet der Anbieter nach Möglichkeit ohne zusätzliche
          Kosten. Materialien und Notizen des Anbieters sind für das eigene
          Lernen bestimmt und dürfen nicht veröffentlicht oder weiterverkauft
          werden.
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
          Die Nachhilfevereinbarung und die Verträge über die Termine sind
          Dienstverträge (§ 611 BGB). Geschuldet ist die fachgerechte
          Durchführung des Unterrichts, nicht ein bestimmter Lern- oder
          Prüfungserfolg (etwa eine bestimmte Note).
        </ProseP>
      </AgbSection>

      <AgbSection id="termine">
        <ProseP>
          Eine Absage oder Verschiebung ist bis 24 Stunden vor dem vereinbarten
          Beginn kostenfrei möglich, etwa per E-Mail, Messenger-Nachricht,
          Telefon oder über die Absagefunktion in der Terminbestätigung.
          Maßgeblich ist der Zeitpunkt, zu dem die Absage beim Anbieter eingeht.
        </ProseP>
        <ProseP>
          Bei einer späteren Absage oder wenn die lernende Person nicht
          erscheint, bleibt das vereinbarte Honorar für den Termin geschuldet
          (Ausfallhonorar). Vergibt der Anbieter den Termin anderweitig,
          entfällt das Ausfallhonorar. Im Übrigen ermäßigt es sich um das, was
          der Anbieter durch den Ausfall erspart, anderweitig erwirbt oder zu
          erwerben böswillig unterlässt (§ 615 Satz 2 BGB).
        </ProseP>
        <ProseP>
          Kein Ausfallhonorar wird berechnet, wenn die Absage auf einem
          wichtigen, nicht zu vertretenden und nicht vorhersehbaren Grund
          beruht, etwa einer plötzlichen Erkrankung der lernenden Person, und
          der Termin unverzüglich abgesagt wird. Ein ärztliches Attest ist dafür
          nicht erforderlich.
        </ProseP>
        <ProseP>
          Erscheint die lernende Person verspätet, endet der Termin zur
          vereinbarten Zeit, und es wird die vereinbarte Dauer berechnet.
          Verspätet sich der Anbieter oder fällt Unterricht wegen einer
          technischen Störung aufseiten des Anbieters oder der genutzten
          Plattform ganz oder teilweise aus, wird die ausgefallene Zeit nach
          Wahl der Kundin oder des Kunden nachgeholt oder nicht berechnet; das
          gilt auch, wenn sich nicht feststellen lässt, auf welcher Seite die
          Störung liegt.
        </ProseP>
        <ProseP>
          Der Anbieter sagt einen Termin nur bei eigener Krankheit, einer
          technischen Störung, höherer Gewalt oder einem vergleichbaren, nicht
          vorhersehbaren Hinderungsgrund ab und teilt dies unverzüglich mit. Er
          bietet nach Möglichkeit einen Ersatztermin an; die Kundin oder der
          Kunde kann ihn annehmen oder den Termin ohne Kosten entfallen lassen.
          Ein Guthaben aus einer Vorauszahlung wird für den abgesagten Termin
          nicht belastet. Wurde der Termin bereits bezahlt, wird der Betrag auf
          einen angenommenen Ersatztermin angerechnet; entfällt der Termin,
          erstattet der Anbieter den Betrag unverzüglich oder schreibt ihn auf
          Wunsch der Kundin oder des Kunden dem Guthaben gut.
        </ProseP>
        <ProseP>
          Das gesetzliche Widerrufsrecht nach {sectionRef("widerruf")} bleibt
          von diesen Regeln unberührt.
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
          dort kein längeres Zahlungsziel angegeben ist, innerhalb von 14 Tagen
          ab Zugang ohne Abzug per PayPal oder Überweisung zu begleichen. Bei
          Zahlungsverzug gelten die gesetzlichen Regelungen.
        </ProseP>
        <ProseP>
          Eine Vorauszahlung ist nur nach ausdrücklicher Absprache möglich. Der
          Anbieter verrechnet sie mit den erbrachten Stunden und etwaigen
          Ausfallhonoraren und teilt den Stand auf Nachfrage mit. Endet die
          Nachhilfevereinbarung, rechnet der Anbieter das Guthaben ab und
          erstattet den nicht verbrauchten Betrag innerhalb von 30 Tagen nach
          Vertragsende. Gesetzliche Rückzahlungsansprüche, insbesondere nach
          einem Widerruf, bleiben unberührt.
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
          Nachhilfevereinbarung jederzeit formlos – etwa per E-Mail – kündigen.
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
          Widerrufsbelehrung zu. Das Widerrufsrecht besteht für die
          Nachhilfevereinbarung und für jeden Termin gesondert; die
          Widerrufsfrist beginnt jeweils mit Abschluss des betreffenden
          Vertrags.
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
            Um Ihr Widerrufsrecht auszuüben, müssen Sie uns ({postalAddress},
            Telefon: {agbContact.phone}, E-Mail:{" "}
            <TextLink variant="doc" href={`mailto:${agbContact.email}`}>
              {agbContact.email}
            </TextLink>
            ) mittels einer eindeutigen Erklärung (z. B. ein mit der Post
            versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen
            Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte
            Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben
            ist.
          </ProseP>
          <ProseP>
            Sie können Ihr Widerrufsrecht auch online unter{" "}
            <TextLink variant="doc" href={routes.withdrawalFunction}>
              {withdrawalFunctionAddress}
            </TextLink>{" "}
            ausüben. Wenn Sie diese Online-Funktion nutzen, übermitteln wir
            Ihnen auf einem dauerhaften Datenträger (z. B. durch eine E-Mail)
            unverzüglich eine Eingangsbestätigung mit Informationen zum Inhalt
            der Widerrufserklärung sowie dem Datum und der Uhrzeit ihres
            Eingangs.
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
            Bei einem Vertrag über Dienstleistungen erlischt das Widerrufsrecht
            mit der vollständigen Erbringung der Dienstleistung, wenn Sie vor
            Beginn der Erbringung ausdrücklich zugestimmt haben, dass der
            Anbieter vor Ablauf der Widerrufsfrist mit der Erbringung beginnt,
            und Ihre Kenntnis davon bestätigt haben, dass Ihr Widerrufsrecht mit
            vollständiger Vertragserfüllung durch den Anbieter erlischt.
          </ProseP>
        </DocSubSection>
        <DocSubSection title="Muster-Widerrufsformular">
          <ProseP>
            (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte
            dieses Formular aus und senden Sie es zurück.)
          </ProseP>
          <DocIndentBlock
            lines={[
              `– An ${postalAddress}, E-Mail: ${agbContact.email}:`,
              "– Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)",
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
        <ProseP>
          Die Haftung nach zwingenden gesetzlichen Vorschriften, insbesondere
          nach dem Produkthaftungsgesetz, bleibt unberührt.
        </ProseP>
      </AgbSection>

      <AgbSection id="schluss">
        <ProseP>
          Es gilt das Recht der Bundesrepublik Deutschland. Hat eine
          Verbraucherin oder ein Verbraucher den gewöhnlichen Aufenthalt in
          einem anderen Staat, bleibt ihr oder ihm der Schutz der zwingenden
          Bestimmungen des Rechts dieses Staates erhalten.
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
