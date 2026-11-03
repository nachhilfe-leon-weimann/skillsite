import {
  DocDetailGrid,
  DocDetailList,
  DocGroup,
  DocHero,
  DocLegalBasis,
  DocLinkList,
  DocList,
  DocProviderLink,
  DocSection,
  DocShell,
  DocSubSection,
} from "@/components/docs/doc-components";
import { ContactAddress } from "@/components/shared/contact-address";
import { InlineLink, ProseP } from "@skillsite/ui/typography/prose";
import {
  analyticsDomain,
  dataRecipientCategories,
  dpaSentence,
  externalPlatformPrivacyLinks,
  hostingProviders,
  lawfulBasisContract,
  logFileItems,
  logFilePurposes,
  privacyContact,
  privacyPolicyEffectiveDate,
  privacySectionHeading,
  privacySectionNumber,
  privacySections,
  retentionItems,
  siteDomain,
  skillBotDataItems,
  skillForgeDataItems,
  supervisoryAuthority,
  umamiCollectedData,
  userRights,
} from "@/content/privacy";
import { pageMetadata } from "@/lib/metadata";
import { CalendarDays, Mail, ShieldCheck } from "lucide-react";

export const metadata = pageMetadata({
  title: "Datenschutz",
  description:
    "Informationen zur Verarbeitung personenbezogener Daten beim Besuch dieser Website, im Nachhilfebetrieb sowie in den eigenen Anwendungen SkillForge und SkillBot.",
  canonical: "/datenschutz",
});

/** Section with its number and heading pulled from the central registry. */
function PrivacySection({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <DocSection id={id} title={privacySectionHeading(id)}>
      {children}
    </DocSection>
  );
}

/** Clickable cross-reference to another section; number from the registry. */
function SectionRef({ id }: { id: string }) {
  return (
    <InlineLink variant="doc" href={`#${id}`}>
      Abschnitt {privacySectionNumber(id)}
    </InlineLink>
  );
}

export default function DatenschutzPage() {
  const effectiveDate = privacyPolicyEffectiveDate.toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });

  return (
    <DocShell
      sections={privacySections}
      hero={
        <DocHero
          badge="Datenschutz nach DSGVO"
          icon={ShieldCheck}
          title={<>Datenschutz&shy;erklärung</>}
          lead="Informationen zur Verarbeitung personenbezogener Daten beim Besuch dieser Website, im Nachhilfebetrieb sowie in den eigenen Anwendungen SkillForge und SkillBot."
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
                <InlineLink
                  variant="doc"
                  href={`mailto:${privacyContact.email}`}
                >
                  {privacyContact.email}
                </InlineLink>
              ),
            },
          ]}
        />
      }
    >
      <PrivacySection id="verantwortlicher">
        <ProseP>
          Verantwortlich für die Verarbeitung Ihrer personenbezogenen Daten ist:
        </ProseP>
        <ContactAddress />
        <ProseP className="mt-6">
          E-Mail:{" "}
          <InlineLink variant="doc" href={`mailto:${privacyContact.email}`}>
            {privacyContact.email}
          </InlineLink>
          <br />
          Telefonnummer:{" "}
          <InlineLink variant="doc" href={`tel:${privacyContact.phone}`}>
            {privacyContact.phone}
          </InlineLink>
        </ProseP>
        <ProseP>
          Diese Datenschutzerklärung gilt für die Website {siteDomain}, für
          meinen gesamten Nachhilfebetrieb sowie für die von mir entwickelten
          und betriebenen Anwendungen SkillForge und SkillBot.
        </ProseP>
      </PrivacySection>

      <PrivacySection id="grundsaetze">
        <ProseP>
          Ich verarbeite personenbezogene Daten nur, soweit dies für die
          Bereitstellung der Website, die Durchführung der Nachhilfe oder die
          Organisation meines Geschäftsbetriebs erforderlich ist. Eine
          automatisierte Entscheidungsfindung einschließlich Profiling (Art. 22
          DSGVO) findet nicht statt.
        </ProseP>
        <ProseP>
          Bei der Terminbuchung sind Name, E-Mail-Adresse, Wunschtermin und Fach
          beziehungsweise Fächer erforderlich. Beim kostenlosen Erstgespräch
          benötige ich zusätzlich eine Telefonnummer, bei einer Nachhilfestunde
          die gewünschte Unterrichtsplattform. Nur ausdrücklich als freiwillig
          gekennzeichnete Angaben sind optional.
        </ProseP>
        <ProseP>
          Die Daten erhalte ich in der Regel direkt von Ihnen. Bei
          minderjährigen Lernenden erhalte ich die Daten üblicherweise von den
          Erziehungsberechtigten (siehe <SectionRef id="minderjaehrige" />
          ).
        </ProseP>
      </PrivacySection>

      <PrivacySection id="hosting">
        <DocSubSection title="Hosting-Anbieter">
          <ProseP>
            Meine Website und Anwendungen werden bei den folgenden Anbietern
            betrieben:
          </ProseP>
          {hostingProviders.map((provider) => (
            <div key={provider.name} className="not-first:mt-5">
              <ProseP className="font-medium">
                {provider.name}, {provider.seat}
              </ProseP>
              <ProseP>
                {provider.services}. {provider.transferNote}
              </ProseP>
              <DocProviderLink href={provider.privacyUrl}>
                Datenschutzerklärung von {provider.shortName}
              </DocProviderLink>
            </div>
          ))}
        </DocSubSection>

        <DocSubSection title="Server-Logfiles">
          <ProseP>
            Beim Aufrufen meiner Website {siteDomain} werden durch Ihren Browser
            automatisch Informationen an den Server gesendet und dort kurzzeitig
            in Logfiles gespeichert:
          </ProseP>
          <DocDetailGrid>
            <DocDetailList
              title="Gespeicherte Informationen"
              items={logFileItems}
            />
            <DocDetailList
              title="Zweck der Verarbeitung"
              items={logFilePurposes}
            />
          </DocDetailGrid>
          <ProseP>
            Die Logfiles werden automatisch rotiert und innerhalb weniger Tage
            überschrieben; eine Zusammenführung mit anderen Daten findet nicht
            statt.
          </ProseP>
          <DocLegalBasis>
            Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer sicheren
            und stabilen Bereitstellung der Website).
          </DocLegalBasis>
        </DocSubSection>

        <DocSubSection title="Schutz vor Missbrauch (Rate-Limiting)">
          <ProseP>
            Bei Formular- und Buchungsanfragen verarbeite ich Ihre IP-Adresse
            für höchstens 24 Stunden ausschließlich im Arbeitsspeicher des
            Servers, um Missbrauch (z. B. automatisierte Massenanfragen) zu
            verhindern. Diese Daten werden nicht dauerhaft gespeichert und nicht
            an Dritte weitergegeben.
          </ProseP>
          <DocLegalBasis>
            Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren
            und stabilen Betrieb von Website und Anwendungen).
          </DocLegalBasis>
        </DocSubSection>
      </PrivacySection>

      <PrivacySection id="website">
        <ProseP>
          Beim Besuch der Website beschränkt sich die Datenverarbeitung auf das
          technisch Erforderliche (<SectionRef id="hosting" />
          ), die pseudonyme Webanalyse (<SectionRef id="webanalyse" />) und die
          folgenden Vorgänge.
        </ProseP>

        <DocSubSection title="Terminbuchung über Cal.com">
          <ProseP>
            Für Terminbuchungen nutze ich den Dienst Cal.com (Cal.com, Inc.,
            2261 Market Street #4382, San Francisco, CA 94114, USA). Die Anzeige
            freier Termine und die Buchung erfolgen serverseitig über meinen
            eigenen Server. Beim Ausfüllen des Formulars lädt Ihr Browser kein
            Cal.com-Widget und baut keine direkte Verbindung zu Cal.com auf;
            Cal.com setzt dabei keine Cookies in Ihrem Browser.
          </ProseP>
          <ProseP>
            Zur Buchung übermittle ich nach Absenden des Formulars die
            eingegebenen Daten an Cal.com: Vor- und Nachname, E-Mail-Adresse,
            Telefonnummer (nur beim kostenlosen Erstgespräch), gewählter Termin,
            Fach beziehungsweise Fächer, bei Online-Nachhilfe die gewünschte
            Unterrichtsplattform (Microsoft Teams oder Discord) sowie
            freiwillige Angaben im Hinweisfeld. Bei einer kostenpflichtigen
            Buchung übermittle ich außerdem die Bestätigung der AGB- und
            Widerrufshinweise sowie die Fassung der einbezogenen AGB als
            Buchungsmetadaten. Zweck ist das Anlegen, Verwalten und Nachbereiten
            des Termins sowie der Nachweis der Buchungsbestätigungen.
          </ProseP>
          <ProseP>
            {dpaSentence("Cal.com")} Eine Verarbeitung personenbezogener Daten
            in den USA kann stattfinden. Die Drittlandübermittlung erfolgt auf
            Grundlage der EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c
            DSGVO), die Teil dieses Vertrags sind.
          </ProseP>
          <DocProviderLink href="https://cal.com/privacy">
            Datenschutzerklärung von Cal.com
          </DocProviderLink>
          <DocLegalBasis>
            {lawfulBasisContract}; ergänzend Art. 6 Abs. 1 lit. f DSGVO
            (technische Bereitstellung und Organisation der Terminbuchung).
          </DocLegalBasis>
        </DocSubSection>

        <DocSubSection title="Cookies und lokale Speicherung">
          <ProseP>
            Diese Website setzt keine Cookies ein und bindet keine
            einwilligungspflichtigen Inhalte Dritter ein. Lediglich technisch
            notwendige Einstellungen – etwa Ihre gewählte Darstellung (helles
            oder dunkles Design) – werden lokal in Ihrem Browser gespeichert,
            damit sie bei Ihrem nächsten Besuch erhalten bleiben. Diese
            Speicherung erfordert keine Einwilligung.
          </ProseP>
          <ProseP>
            Schriftarten und Bilder liegen auf meinem eigenen Server; Ihr
            Browser baut beim Besuch der Website keine Verbindung zu Servern
            Dritter auf (auch nicht zu Google Fonts).
          </ProseP>
          <DocLegalBasis>
            § 25 Abs. 2 TDDDG sowie Art. 6 Abs. 1 lit. f DSGVO für technisch
            notwendige Speicherungen.
          </DocLegalBasis>
        </DocSubSection>

        <DocSubSection title="Verlinkung zu externen Plattformen">
          <ProseP>
            Meine Website enthält Links zu externen Diensten (Discord, WhatsApp,
            Instagram, YouTube, TikTok, GitHub). Erst beim Anklicken werden
            Daten an den jeweiligen Anbieter übertragen. Bitte beachten Sie die
            Datenschutzbestimmungen dieser Plattformen:
          </ProseP>
          <DocLinkList links={externalPlatformPrivacyLinks} />
        </DocSubSection>
      </PrivacySection>

      <PrivacySection id="webanalyse">
        <ProseP>
          Ich nutze die Webanalyse-Software Umami, um die Nutzung meiner Website
          statistisch auszuwerten und mein Angebot zu verbessern. Umami betreibe
          ich selbst auf meinem eigenen Server ({analyticsDomain}, Hostinger-VPS
          in Frankfurt am Main); es werden keine Daten an einen externen
          Analysedienst übertragen. Erfasst werden:
        </ProseP>
        <DocList items={umamiCollectedData} />
        <ProseP>
          Die Daten werden ausschließlich pseudonymisiert und aggregiert
          gespeichert. Zur Unterscheidung von Besuchern dient eine Kennung, die
          als Hash aus technischen Merkmalen gebildet wird und deren
          Bestandteile monatlich wechseln – eine Wiedererkennung über
          Monatsgrenzen hinweg oder eine Rückrechnung auf Ihre IP-Adresse ist
          nicht möglich. Ein seitenübergreifendes Tracking findet nicht statt.
        </ProseP>
        <ProseP>
          Umami setzt keine Cookies und speichert oder liest keine Informationen
          auf Ihrem Endgerät; eine Einwilligung nach § 25 TDDDG ist daher nicht
          erforderlich.
        </ProseP>
        <DocLegalBasis>
          Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der
          Reichweitenmessung und Verbesserung meines Angebots). Sie können
          dieser Verarbeitung jederzeit widersprechen (siehe{" "}
          <SectionRef id="widerspruch" />
          ).
        </DocLegalBasis>
      </PrivacySection>

      <PrivacySection id="nachhilfe">
        <ProseP>
          Im Rahmen der Nachhilfe verarbeite ich Vertrags- und Stammdaten (Name
          und Kontaktdaten der Lernenden sowie der Erziehungsberechtigten,
          Fächer, Termine, Abrechnungsdaten). Dafür setze ich die folgenden
          Dienste ein.
        </ProseP>

        <DocGroup title="Abrechnung und Buchhaltung">
          <DocSubSection title="Zeiterfassung und Abrechnung (Clockodo)">
            <ProseP>
              Für Zeiterfassung und Abrechnung nutze ich den Dienst Clockodo
              (Clockodo GmbH, Viktoriastraße 25A, 59425 Unna). Verarbeitet
              werden Name, Kontaktdaten und Abrechnungsinformationen.{" "}
              {dpaSentence("der Clockodo GmbH")}
            </ProseP>
            <DocProviderLink href="https://www.clockodo.com/de/datenschutz/">
              Datenschutzerklärung von Clockodo
            </DocProviderLink>
            <DocLegalBasis>{lawfulBasisContract}.</DocLegalBasis>
          </DocSubSection>

          <DocSubSection title="Buchhaltung (sevDesk)">
            <ProseP>
              Zur Abwicklung meiner Buchhaltung nutze ich sevDesk (sevDesk GmbH,
              Hauptstraße 115, 77652 Offenburg). Dabei werden Kundendaten (Name,
              Adresse, Rechnungsdaten) verarbeitet.{" "}
              {dpaSentence("der sevDesk GmbH")} Rechnungs- und Buchungsdaten
              unterliegen den gesetzlichen Aufbewahrungsfristen (§ 147 AO, § 257
              HGB).
            </ProseP>
            <DocProviderLink href="https://sevdesk.de/datenschutz/">
              Datenschutzerklärung von sevDesk
            </DocProviderLink>
            <DocLegalBasis>
              {lawfulBasisContract}; ergänzend Art. 6 Abs. 1 lit. c DSGVO
              (gesetzliche Aufbewahrungspflichten).
            </DocLegalBasis>
          </DocSubSection>
        </DocGroup>

        <DocGroup title="Kommunikation und Unterricht">
          <DocSubSection title="E-Mail, Teams und Formulare (Microsoft 365)">
            <ProseP>
              Für E-Mails, Online-Meetings und Anmeldungen nutze ich Microsoft
              365 (Microsoft Ireland Operations Limited, Dublin, Irland).
            </ProseP>
            <DocList
              items={[
                "E-Mail und Teams: Kommunikation mit Lernenden und Kunden",
                "Microsoft Forms: Erfassung von Anmeldedaten (z. B. Name, E-Mail-Adresse, Unterrichtsfach)",
              ]}
            />
            <ProseP>
              {dpaSentence("Microsoft")} Er ist Bestandteil der
              Microsoft-Produktbedingungen. Soweit eine Übermittlung in die USA
              stattfindet, ist Microsoft unter dem EU-US Data Privacy Framework
              zertifiziert.
            </ProseP>
            <DocProviderLink href="https://privacy.microsoft.com/de-de/privacystatement">
              Datenschutzerklärung von Microsoft
            </DocProviderLink>
            <DocLegalBasis>{lawfulBasisContract}.</DocLegalBasis>
          </DocSubSection>

          <DocSubSection title="Kommunikation (WhatsApp Business)">
            <ProseP>
              Ich biete zur Kontaktaufnahme WhatsApp an (WhatsApp Ireland
              Limited, Dublin / Meta Platforms Inc., USA). Dabei werden
              Telefonnummern und Nachrichteninhalte verarbeitet. Soweit dabei
              eine Übermittlung in die USA stattfindet, stützt sich WhatsApp
              Ireland auf das EU-US Data Privacy Framework, unter dem die
              empfangenden Meta-Gesellschaften zertifiziert sind. Die Nutzung
              ist freiwillig – Sie erreichen mich ebenso per E-Mail oder
              Telefon.
            </ProseP>
            <DocProviderLink href="https://www.whatsapp.com/legal/privacy-policy-eea">
              Datenschutzerklärung von WhatsApp
            </DocProviderLink>
            <DocLegalBasis>
              {lawfulBasisContract}; ergänzend Art. 6 Abs. 1 lit. f DSGVO
              (Kommunikation auf Ihren Wunsch).
            </DocLegalBasis>
          </DocSubSection>

          <DocSubSection title="Kontaktanfragen (Kleinanzeigen)">
            <ProseP>
              Ich nutze die Plattform Kleinanzeigen (Kleinanzeigen GmbH, Berlin)
              für die Kontaktaufnahme. Bei Anfragen werden dort Name,
              Kontaktdaten und Nachrichteninhalte verarbeitet. Verantwortlich
              für die Datenverarbeitung auf der Plattform ist die Kleinanzeigen
              GmbH.
            </ProseP>
            <DocProviderLink href="https://themen.kleinanzeigen.de/datenschutzerklaerung/">
              Datenschutzerklärung von Kleinanzeigen
            </DocProviderLink>
            <DocLegalBasis>
              {lawfulBasisContract}; ergänzend Art. 6 Abs. 1 lit. f DSGVO
              (Bearbeitung eingehender Kontaktanfragen).
            </DocLegalBasis>
          </DocSubSection>

          <DocSubSection title="Online-Unterricht (Discord)">
            <ProseP>
              Für Online-Nachhilfe nutze ich einen Discord-Server (Discord Inc.,
              San Francisco, USA). Dabei werden Benutzernamen,
              Kommunikationsinhalte und Nutzungsdaten verarbeitet. Soweit dabei
              eine Übermittlung in die USA stattfindet, ist Discord unter dem
              EU-US Data Privacy Framework zertifiziert.
            </ProseP>
            <DocProviderLink href="https://discord.com/privacy">
              Datenschutzerklärung von Discord
            </DocProviderLink>
            <DocLegalBasis>{lawfulBasisContract}.</DocLegalBasis>
          </DocSubSection>
        </DocGroup>

        <DocGroup title="Zahlung">
          <DocSubSection title="Zahlung (PayPal)">
            <ProseP>
              Bei Zahlung per PayPal werden Zahlungsdaten an PayPal (Europe) S.à
              r.l. et Cie, Luxemburg, übermittelt. PayPal ist dabei eigenständig
              datenschutzrechtlich verantwortlich.
            </ProseP>
            <DocProviderLink href="https://www.paypal.com/de/webapps/mpp/ua/privacy-full">
              Datenschutzerklärung von PayPal
            </DocProviderLink>
            <DocLegalBasis>{lawfulBasisContract}.</DocLegalBasis>
          </DocSubSection>

          <DocSubSection title="Banküberweisung">
            <ProseP>
              Bei Zahlung per Banküberweisung werden die angegebenen
              Zahlungsdaten an das kontoführende Kreditinstitut übermittelt.
            </ProseP>
            <DocLegalBasis>{lawfulBasisContract}.</DocLegalBasis>
          </DocSubSection>
        </DocGroup>
      </PrivacySection>

      <PrivacySection id="eigene-software">
        <ProseP>
          Zur Organisation der Nachhilfe setze ich zwei selbst entwickelte
          Anwendungen ein.
        </ProseP>

        <DocSubSection title="SkillForge">
          <ProseP>
            SkillForge unterstützt mich bei der Verwaltung von Lernenden,
            Terminen und Unterricht. Verarbeitet werden insbesondere:
          </ProseP>
          <DocList items={skillForgeDataItems} />
          <ProseP>
            SkillForge läuft auf meinem eigenen virtuellen Server bei Hostinger
            in Frankfurt am Main (siehe <SectionRef id="hosting" />
            ); die Daten verbleiben innerhalb der EU.
          </ProseP>
        </DocSubSection>

        <DocSubSection title="SkillBot (Discord-Bot)">
          <ProseP>
            SkillBot ist ein Discord-Bot, der auf meinem Discord-Server
            Funktionen zur Organisation des Unterrichts bereitstellt.
            Verarbeitet werden insbesondere:
          </ProseP>
          <DocList items={skillBotDataItems} />
          <ProseP>
            SkillBot wird bei Cybrancee (How About Group Ltd, Vereinigtes
            Königreich) gehostet. Die Übermittlung in das Vereinigte Königreich
            ist durch den Angemessenheitsbeschluss der EU-Kommission abgesichert
            (Art. 45 DSGVO); die Regelungen zur Auftragsverarbeitung nach Art.
            28 DSGVO finden Sie unter <SectionRef id="hosting" />.
          </ProseP>
        </DocSubSection>

        <DocLegalBasis>
          {lawfulBasisContract}; ergänzend Art. 6 Abs. 1 lit. f DSGVO
          (effiziente Organisation und Sicherheit des Unterrichtsbetriebs).
        </DocLegalBasis>
      </PrivacySection>

      <PrivacySection id="minderjaehrige">
        <ProseP>
          Meine Nachhilfe richtet sich überwiegend an minderjährige Lernende.
          Vertragspartner sind in diesen Fällen die Erziehungsberechtigten; von
          ihnen erhalte ich auch die Daten der Lernenden.
        </ProseP>
        <ProseP>
          Die Verarbeitung der Daten der Lernenden erfolgt zur Durchführung des
          mit den Erziehungsberechtigten geschlossenen Vertrags. Ich stütze
          keine Datenverarbeitung auf die Einwilligung Minderjähriger; Angebote
          wie der Discord-Server werden nur in Abstimmung mit den
          Erziehungsberechtigten genutzt.
        </ProseP>
        <DocLegalBasis>
          Art. 6 Abs. 1 lit. b DSGVO (Durchführung des mit den
          Erziehungsberechtigten geschlossenen Vertrags).
        </DocLegalBasis>
      </PrivacySection>

      <PrivacySection id="weitergabe">
        <ProseP>
          Ihre Daten gebe ich nur in den in dieser Erklärung beschriebenen
          Fällen weiter, und zwar an folgende Kategorien von Empfängern:
        </ProseP>
        <DocList items={dataRecipientCategories} />
        <ProseP>
          Eine Verarbeitung außerhalb der EU bzw. des EWR findet nur wie oben
          beschrieben statt: in den USA (Cal.com auf Grundlage der
          EU-Standardvertragsklauseln; Microsoft, Discord und WhatsApp/Meta auf
          Grundlage des EU-US Data Privacy Frameworks) sowie im Vereinigten
          Königreich (Cybrancee auf Grundlage des Angemessenheitsbeschlusses der
          EU-Kommission nach Art. 45 DSGVO).
        </ProseP>
      </PrivacySection>

      <PrivacySection id="speicherdauer">
        <ProseP>
          Ich speichere personenbezogene Daten nur so lange, wie es für die
          jeweiligen Zwecke erforderlich ist oder gesetzliche
          Aufbewahrungspflichten bestehen:
        </ProseP>
        <DocList items={retentionItems} />
      </PrivacySection>

      <PrivacySection id="rechte">
        <ProseP>Sie haben jederzeit das Recht,</ProseP>
        <DocList items={userRights} />
        <DocSubSection title="Zuständige Aufsichtsbehörde">
          <ProseP>
            {supervisoryAuthority.name}
            <br />
            {supervisoryAuthority.street}
            <br />
            {supervisoryAuthority.city}
            <br />
            Telefon: {supervisoryAuthority.phone}
            <br />
            E-Mail:{" "}
            <InlineLink
              variant="doc"
              href={`mailto:${supervisoryAuthority.email}`}
            >
              {supervisoryAuthority.email}
            </InlineLink>
          </ProseP>
          <DocProviderLink href={supervisoryAuthority.url}>
            Website der Aufsichtsbehörde
          </DocProviderLink>
        </DocSubSection>
      </PrivacySection>

      <PrivacySection id="widerspruch">
        <ProseP className="font-medium">
          Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen
          Situation ergeben, jederzeit gegen die Verarbeitung Sie betreffender
          personenbezogener Daten zu widersprechen, die auf Grundlage von Art. 6
          Abs. 1 lit. f DSGVO erfolgt (Art. 21 Abs. 1 DSGVO).
        </ProseP>
        <ProseP>
          Ich verarbeite die Daten dann nicht mehr, es sei denn, ich kann
          zwingende schutzwürdige Gründe für die Verarbeitung nachweisen, die
          Ihre Interessen, Rechte und Freiheiten überwiegen, oder die
          Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von
          Rechtsansprüchen. Das betrifft insbesondere die Server-Logfiles und
          die Webanalyse mit Umami. Direktwerbung betreibe ich nicht. Ein
          formloser Widerspruch an{" "}
          <InlineLink variant="doc" href={`mailto:${privacyContact.email}`}>
            {privacyContact.email}
          </InlineLink>{" "}
          genügt.
        </ProseP>
      </PrivacySection>

      <PrivacySection id="datensicherheit">
        <ProseP>
          Ich nutze technische und organisatorische Sicherheitsmaßnahmen, um
          Ihre Daten gegen Verlust, Zerstörung und unbefugten Zugriff zu
          schützen. Die Übertragung von Daten an diese Website erfolgt
          ausschließlich TLS-verschlüsselt (HTTPS).
        </ProseP>
      </PrivacySection>

      <PrivacySection id="aktualitaet">
        <ProseP>
          Diese Datenschutzerklärung ist aktuell gültig und hat den Stand{" "}
          {effectiveDate}. Änderungen können durch Anpassungen meiner Dienste
          oder aufgrund geänderter gesetzlicher Vorgaben notwendig werden.
        </ProseP>
      </PrivacySection>
    </DocShell>
  );
}
