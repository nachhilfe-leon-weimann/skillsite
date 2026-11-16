import {
  DocDetailGrid,
  DocDetailList,
  DocGroup,
  DocLegalBasis,
  DocLinkList,
  DocList,
  DocProviderLink,
  DocSection,
  DocSubSection,
} from "@/components/docs/doc-components";
import { ContactAddress } from "@/components/sections/contact-address";
import { ProseP } from "@skillsite/ui/typography/prose";
import { TextLink } from "@skillsite/ui/primitives/link";
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
  privacySections,
  retentionItems,
  siteDomain,
  skillBotDataItems,
  skillForgeDataItems,
  supervisoryAuthority,
  umamiCollectedData,
  userRights,
} from "@/content/privacy";

/** /datenschutz around its prose: metadata and hero. */
export const privacyPage = {
  metadata: {
    title: "Datenschutz",
    description:
      "Informationen zur Verarbeitung personenbezogener Daten beim Besuch dieser Website, im Nachhilfebetrieb sowie in den eigenen Anwendungen SkillForge und SkillBot.",
  },
  hero: {
    badge: "Datenschutz nach DSGVO",
    title: <>Datenschutz&shy;erklärung</>,
    lead: "Informationen zur Verarbeitung personenbezogener Daten beim Besuch dieser Website, im Nachhilfebetrieb sowie in den eigenen Anwendungen SkillForge und SkillBot.",
    facts: {
      effectiveDate: "Stand",
      contact: "Kontakt",
    },
  },
};

/** Section with its number and heading pulled from the central registry. */
function PrivacySection({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <DocSection id={id} title={privacySections.heading(id)}>
      {children}
    </DocSection>
  );
}

/** Clickable cross-reference to another section; number from the registry. */
function SectionRef({ id }: { id: string }) {
  return (
    <TextLink variant="doc" href={`#${id}`}>
      Abschnitt {privacySections.number(id)}
    </TextLink>
  );
}

/**
 * The privacy policy's sections, in order, as /datenschutz renders them.
 * `effectiveDate` is the formatted "Stand" date the page also shows in its hero.
 */
export function PrivacyProse({ effectiveDate }: { effectiveDate: string }) {
  return (
    <>
      <PrivacySection id="verantwortlicher">
        <ProseP>
          Verantwortlich für die Verarbeitung Ihrer personenbezogenen Daten ist:
        </ProseP>
        <ContactAddress />
        <ProseP className="mt-6">
          E-Mail:{" "}
          <TextLink variant="doc" href={`mailto:${privacyContact.email}`}>
            {privacyContact.email}
          </TextLink>
          <br />
          Telefonnummer:{" "}
          <TextLink variant="doc" href={`tel:${privacyContact.phone}`}>
            {privacyContact.phone}
          </TextLink>
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
          gekennzeichnete Angaben sind optional. Gesetzlich verpflichtet sind
          Sie zu keiner dieser Angaben. Ohne die erforderlichen Angaben kann ich
          jedoch keinen Termin vergeben und keinen Nachhilfevertrag schließen
          oder durchführen.
        </ProseP>
        <ProseP>
          Die Daten erhalte ich in der Regel direkt von Ihnen. Bei
          minderjährigen Lernenden erhalte ich die Daten üblicherweise von den
          Erziehungsberechtigten (siehe <SectionRef id="minderjaehrige" />
          ).
        </ProseP>
      </PrivacySection>

      <PrivacySection id="hosting">
        <DocSubSection title="Anbieter für Hosting und Auslieferung">
          <ProseP>
            Meine Website und Anwendungen betreibe ich mit Hilfe der folgenden
            Anbieter:
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

        <DocSubSection title="Auslieferung und Schutz über Cloudflare">
          <ProseP>
            Alle Aufrufe dieser Website, der Webanalyse ({analyticsDomain}) und
            von SkillForge laufen über das Netzwerk von Cloudflare. Cloudflare
            beantwortet die DNS-Anfragen für meine Domains und ist meinem Server
            als Schutz- und Auslieferungsschicht vorgeschaltet (Reverse Proxy):
            Ihr Browser verbindet sich mit einem Rechenzentrum von Cloudflare,
            in der Regel in Ihrer Nähe, das die Anfrage prüft und an meinen
            Server in Frankfurt am Main weiterleitet.
          </ProseP>
          <ProseP>
            Dabei verarbeitet Cloudflare in meinem Auftrag Ihre IP-Adresse,
            technische Verbindungsdaten (Datum und Uhrzeit, aufgerufene Adresse,
            Referrer, Browser und Betriebssystem) sowie die übertragenen Inhalte
            – also auch Angaben, die Sie in ein Formular eingeben. Die
            Verbindung ist sowohl zwischen Ihrem Browser und Cloudflare als auch
            zwischen Cloudflare und meinem Server verschlüsselt; zur Prüfung und
            Weiterleitung werden die Daten in den Systemen von Cloudflare
            kurzzeitig entschlüsselt verarbeitet. Daneben nutzt Cloudflare nach
            eigenen Angaben aus dem Datenverkehr abgeleitete Informationen, etwa
            Einschätzungen zu IP-Adressen als mögliche Angriffsquelle, in
            eigener Verantwortung, um sein Netzwerk zu betreiben und vor
            Angriffen zu schützen.
          </ProseP>
          <ProseP>
            Zweck ist der Schutz von Website und Anwendungen vor Angriffen und
            Überlastung (z. B. DDoS-Angriffe, automatisierte Zugriffe durch
            Bots, Spam) sowie eine schnelle und ausfallsichere Auslieferung.
            Dazu kann Cloudflare statische Inhalte wie Bilder, Schriftarten und
            Skripte zwischenspeichern und die ausgelieferten Seiten technisch
            anpassen, etwa E-Mail-Adressen im Quelltext zum Schutz vor
            Spam-Programmen verschleiern oder das Laden von Skripten optimieren;
            dafür bindet Cloudflare kleine Hilfsskripte ein, die ebenfalls über
            Cloudflare ausgeliefert werden.
          </ProseP>
          <ProseP>
            Zur Abwehr automatisierter Zugriffe kann Cloudflare außerdem prüfen,
            ob eine Anfrage von einem Menschen oder von einem Programm stammt.
            Dazu können technische Merkmale Ihres Browsers ausgewertet werden;
            bei auffälligen Zugriffen kann vor der Seite eine kurze, meist
            automatisch ablaufende Sicherheitsprüfung erscheinen (Challenge). In
            diesem Zusammenhang kann Cloudflare technisch notwendige Cookies
            setzen (siehe <SectionRef id="website" />
            ).
          </ProseP>
          <ProseP>
            Aus den über Cloudflare laufenden Anfragen stellt mir Cloudflare
            zusammengefasste Statistiken zum Datenverkehr und zur Sicherheit
            bereit (z. B. Zahl der Anfragen, übertragene Datenmenge,
            Herkunftsländer, abgewehrte Zugriffe). Zu abgewehrten oder geprüften
            Zugriffen kann ich außerdem bis zu 31 Tage lang Einzelangaben wie
            IP-Adresse, aufgerufene Adresse und Browserkennung einsehen. Ich
            nutze diese Angaben ausschließlich, um den Betrieb zu überwachen und
            Angriffe zu erkennen; in Ihrem Browser wird dafür nichts gespeichert
            oder ausgelesen.
          </ProseP>
          <ProseP>
            Protokolldaten zu den Verbindungen, insbesondere IP-Adressen,
            verarbeitet Cloudflare für begrenzte Zeit auch in Rechenzentren in
            den USA und in Europa. Die Grundlagen dieser Übermittlung sind oben
            beim Anbieter genannt.
          </ProseP>
          <DocLegalBasis>
            Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem
            sicheren, stabilen und schnellen Betrieb von Website und Anwendungen
            einschließlich der Auswertung von Zugriffs- und
            Sicherheitsstatistiken); für technisch notwendige Cookies und die
            Prüfung Ihres Browsers § 25 Abs. 2 Nr. 2 TDDDG.
          </DocLegalBasis>
        </DocSubSection>

        <DocSubSection title="Datensicherungen (Backups)">
          <ProseP>
            Um Datenverlust vorzubeugen, erstelle ich regelmäßig
            Sicherungskopien der Datenbanken auf meinem Server (SkillForge,
            SkillBot und Webanalyse Umami) und lege sie im Speicherdienst
            Cloudflare R2 ab, und zwar in einem Speicherbereich, für den
            Cloudflare die Speicherung innerhalb der Europäischen Union
            zusichert. Die Sicherungen werden verschlüsselt übertragen und von
            Cloudflare verschlüsselt gespeichert; Cloudflare verarbeitet sie
            ausschließlich in meinem Auftrag.
          </ProseP>
          <ProseP>
            Zusätzlich erstellt mein Hosting-Anbieter Hostinger in meinem
            Auftrag wöchentlich eine Sicherung des gesamten Servers. Davon
            werden höchstens zwei vorgehalten; die jeweils älteste wird durch
            die neue ersetzt.
          </ProseP>
          <ProseP>
            Die Sicherungen bei Cloudflare werden nach 30 Tagen automatisch
            gelöscht, die Server-Sicherungen bei Hostinger spätestens nach drei
            Wochen ersetzt. Daten, die ich im laufenden Betrieb lösche, können
            bis dahin noch in einer Sicherung enthalten sein.
          </ProseP>
          <DocLegalBasis>
            Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am Schutz vor
            Datenverlust und an der Wiederherstellbarkeit der Daten); zugleich
            eine Sicherheitsmaßnahme nach Art. 32 DSGVO.
          </DocLegalBasis>
        </DocSubSection>

        <DocSubSection title="Server-Logfiles">
          <ProseP>
            Beim Aufrufen meiner Website {siteDomain} sendet Ihr Browser
            automatisch Informationen, die über Cloudflare an meinen Server
            gelangen und dort in Logfiles gespeichert werden:
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
            Die Logfiles werden nach höchstens 14 Tagen gelöscht; die
            Zugriffsdaten führe ich nicht mit anderen Daten zusammen.
          </ProseP>
          <ProseP>
            Zusätzlich protokolliert die Anwendung zu jedem Buchungsversuch die
            Terminart, den gewählten Termin, die Dauer, die Zeit bis zum
            Absenden des Formulars, das Ergebnis und eine gekürzte
            E-Mail-Adresse (z. B. „ma***@beispiel.de“), bei erfolgreicher
            Buchung außerdem die Buchungsnummer von Cal.com, bei einem Fehler
            technische Fehlerangaben und, falls der Spamschutz anschlägt, den
            Inhalt des versteckten Prüffelds. Beim Aufruf eines Zahlungslinks
            protokolliert sie Rechnungsnummer und Betrag. Name, Telefonnummer
            und Hinweistext aus dem Formular sowie IP-Adressen werden dabei
            nicht protokolliert. Die Einträge dienen dazu, fehlgeschlagene oder
            irrtümlich abgewiesene Buchungen und Zahlungen nachzuvollziehen.
            Auch diese Einträge werden nach höchstens 14 Tagen gelöscht.
          </ProseP>
          <DocLegalBasis>
            Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer sicheren
            und stabilen Bereitstellung der Website).
          </DocLegalBasis>
        </DocSubSection>

        <DocSubSection title="Schutz vor Missbrauch (Rate-Limiting)">
          <ProseP>
            Bei Formular- und Buchungsanfragen verarbeite ich Ihre IP-Adresse
            für höchstens 24 Stunden nach der letzten Anfrage ausschließlich im
            Arbeitsspeicher des Servers, um Missbrauch (z. B. automatisierte
            Massenanfragen) zu verhindern. Diese Daten werden nicht dauerhaft
            gespeichert und nicht an Dritte weitergegeben.
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
            Telefonnummer (nur beim kostenlosen Erstgespräch), gewählter Termin
            und Dauer, Fach beziehungsweise Fächer, bei Online-Nachhilfe die
            gewünschte Unterrichtsplattform (Microsoft Teams oder Discord) sowie
            freiwillige Angaben im Hinweisfeld. Bei einer kostenpflichtigen
            Buchung übermittle ich außerdem die Bestätigung der AGB- und
            Widerrufshinweise sowie die Fassung der einbezogenen AGB als
            Buchungsmetadaten. Zweck ist das Anlegen, Verwalten und Nachbereiten
            des Termins sowie der Nachweis der Buchungsbestätigungen.
          </ProseP>
          <ProseP>
            {dpaSentence("Cal.com")} Er ist Bestandteil der
            Cal.com-Nutzungsbedingungen. Cal.com verarbeitet die Daten in den
            USA. Die Übermittlung stützt sich auf den Angemessenheitsbeschluss
            der EU-Kommission zum EU-US Data Privacy Framework (Art. 45 DSGVO),
            unter dem Cal.com zertifiziert ist; für davon nicht erfasste
            Übermittlungen sieht der Vertrag die EU-Standardvertragsklauseln vor
            (Art. 46 Abs. 2 lit. c DSGVO). Vertrag und Standardvertragsklauseln
            veröffentlicht Cal.com unter cal.com/dpa und cal.com/dpa-scc.
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
            Ich setze auf dieser Website keine Cookies zu Analyse-, Werbe- oder
            Marketingzwecken ein und binde keine einwilligungspflichtigen
            Inhalte Dritter ein. Technisch notwendige Einstellungen – etwa Ihre
            gewählte Darstellung (helles oder dunkles Design) – werden lokal in
            Ihrem Browser gespeichert, damit sie bei Ihrem nächsten Besuch
            erhalten bleiben.
          </ProseP>
          <ProseP>
            Zum Schutz vor Angriffen und automatisierten Zugriffen kann der
            vorgeschaltete Dienst Cloudflare (siehe <SectionRef id="hosting" />)
            auf dieser Website und den zugehörigen Domains technisch notwendige
            Cookies setzen, insbesondere „__cf_bm“ (Erkennung automatisierter
            Zugriffe, Laufzeit 30 Minuten nach dem letzten Aufruf) und
            „cf_clearance“ (Nachweis einer bestandenen Sicherheitsprüfung,
            Laufzeit in der Standardeinstellung 30 Minuten). Diese Cookies
            dienen ausschließlich der Sicherheit und werden nicht für Analyse-
            oder Werbezwecke verwendet; nach Angaben von Cloudflare werden Sie
            damit nicht über verschiedene Websites hinweg verfolgt.
          </ProseP>
          <ProseP>
            Diese Speicherungen und Zugriffe sind unbedingt erforderlich, um die
            Website sicher und in der von Ihnen gewünschten Form
            bereitzustellen; eine Einwilligung ist dafür nicht erforderlich.
          </ProseP>
          <ProseP>
            Schriftarten und Bilder liegen auf meinem eigenen Server und werden
            wie die gesamte Website über Cloudflare ausgeliefert. Darüber hinaus
            baut Ihr Browser beim Besuch der Website keine Verbindung zu Servern
            anderer Anbieter auf (auch nicht zu Google Fonts).
          </ProseP>
          <DocLegalBasis>
            § 25 Abs. 2 Nr. 2 TDDDG für technisch notwendige Speicherungen und
            Zugriffe auf Ihrem Endgerät; Art. 6 Abs. 1 lit. f DSGVO für die
            damit verbundene Datenverarbeitung (berechtigtes Interesse an einer
            sicheren und nutzerfreundlichen Website).
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
          in Frankfurt am Main). Umami überträgt keine Daten an einen externen
          Analysedienst. Die Anfragen an Umami laufen wie alle Aufrufe der
          Website über Cloudflare (siehe <SectionRef id="hosting" />
          ). Erfasst werden:
        </ProseP>
        <DocList items={umamiCollectedData} />
        <ProseP>
          Die Daten werden pseudonymisiert gespeichert und nur in
          zusammengefasster Form ausgewertet. Zur Unterscheidung von Besuchern
          dient eine Kennung, die als Hash aus technischen Merkmalen gebildet
          wird und deren Bestandteile monatlich wechseln – eine Wiedererkennung
          über Monatsgrenzen hinweg oder eine Rückrechnung auf Ihre IP-Adresse
          ist nicht möglich. Ein seitenübergreifendes Tracking findet nicht
          statt. Nach 24 Monaten werden die Daten automatisch gelöscht.
        </ProseP>
        <ProseP>
          Umami setzt keine Cookies und legt keine Kennung oder andere
          Informationen auf Ihrem Endgerät ab. Das Analyse-Skript liest
          Bildschirmgröße und Browsersprache aus, prüft einen Eintrag im lokalen
          Speicher Ihres Browsers, mit dem sich die Erfassung abschalten lässt,
          und übermittelt die oben genannten Angaben an meinen Server.
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
        <ProseP>
          Nach dem Erstgespräch sende ich Ihnen die Nachhilfevereinbarung mit
          den Eckdaten der Nachhilfe (Vertragspartner mit Anschrift, Name und
          Klasse der lernenden Person, Fächer, Umfang, Preis, gegebenenfalls
          Vorauszahlung) per E-Mail. Ihre Antwort-E-Mail mit der Zustimmung und
          dem ausdrücklichen Verlangen nach Beginn vor Ablauf der Widerrufsfrist
          bewahre ich als Vertragsnachweis auf.
        </ProseP>
        <DocLegalBasis>
          {lawfulBasisContract}; für die Aufbewahrung der Zustimmungs-E-Mail als
          Nachweis Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse daran, den
          Vertragsschluss nachweisen und Ansprüche abwehren zu können).
        </DocLegalBasis>

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
              Im Unteren Angel 1, 77652 Offenburg). Dabei werden Kundendaten
              (Name, Adresse, Rechnungsdaten) verarbeitet.{" "}
              {dpaSentence("der sevDesk GmbH")} Rechnungs- und Buchungsdaten
              unterliegen den gesetzlichen Aufbewahrungsfristen (§ 147 AO, § 14b
              UStG).
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
              Limited, Dublin / Meta Platforms, Inc., USA). Dabei werden
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
              Ich nutze die Plattform Kleinanzeigen (kleinanzeigen.de GmbH,
              Dernburgstraße 50, 14057 Berlin) für die Kontaktaufnahme. Bei
              Anfragen werden dort Name, Kontaktdaten und Nachrichteninhalte
              verarbeitet. Verantwortlich für die Datenverarbeitung auf der
              Plattform ist die kleinanzeigen.de GmbH.
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
              Für Online-Nachhilfe nutze ich einen Discord-Server. Anbieter ist
              für Personen im Europäischen Wirtschaftsraum die Discord
              Netherlands B.V., Schiphol Boulevard 195, 1118 BG Schiphol,
              Niederlande; sie ist für die Datenverarbeitung auf der Plattform
              eigenständig verantwortlich. Verarbeitet werden Benutzernamen,
              Kommunikationsinhalte und Nutzungsdaten. Discord speichert die
              Daten nach eigenen Angaben auf Servern der Discord Inc. in den
              USA; die Übermittlung stützt Discord auf
              EU-Standardvertragsklauseln und das EU-US Data Privacy Framework,
              unter dem die Discord Inc. zertifiziert ist.
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
              r.l. et Cie, S.C.A., 22–24 Boulevard Royal, L-2449 Luxemburg,
              übermittelt. PayPal ist dabei eigenständig datenschutzrechtlich
              verantwortlich.
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
            SkillForge und die zugehörige Datenbank (PostgreSQL) laufen auf
            meinem eigenen virtuellen Server bei Hostinger in Frankfurt am Main;
            die Daten werden damit innerhalb der EU gespeichert. Der Zugriff auf
            SkillForge läuft über Cloudflare, Sicherungen der Datenbank liegen
            bei Cloudflare R2 in der EU (jeweils siehe{" "}
            <SectionRef id="hosting" />
            ).
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
            SkillBot läuft ebenfalls auf meinem eigenen virtuellen Server bei
            Hostinger in Frankfurt am Main. Seine Daten liegen in der dortigen
            Datenbank und werden wie die übrigen Daten gesichert (siehe{" "}
            <SectionRef id="hosting" />
            ).
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
          Bei minderjährigen Lernenden schließe ich den Nachhilfevertrag stets
          mit den Erziehungsberechtigten. Die Daten der Lernenden verarbeite
          ich, um den mit den Erziehungsberechtigten geschlossenen Vertrag zu
          erfüllen und den Unterricht durchzuführen. Ich stütze keine
          Datenverarbeitung auf die Einwilligung Minderjähriger; Angebote wie
          der Discord-Server werden nur in Abstimmung mit den
          Erziehungsberechtigten genutzt. Buchen Lernende mit Vollmacht ihrer
          Eltern selbst Termine, handeln sie in deren Namen; ihre Angaben im
          Buchungsformular verarbeite ich dann auf derselben Grundlage wie die
          übrigen Daten der Lernenden.
        </ProseP>
        <DocLegalBasis>
          Art. 6 Abs. 1 lit. b DSGVO, soweit es um die Daten der
          Erziehungsberechtigten als Vertragspartner geht; für die Daten der
          Lernenden Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse daran,
          den mit den Erziehungsberechtigten geschlossenen Nachhilfevertrag zu
          erfüllen und den Unterricht durchzuführen). Schließen volljährige
          Lernende den Vertrag selbst, gilt für ihre Daten Art. 6 Abs. 1 lit. b
          DSGVO.
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
          beschrieben statt, und zwar vor allem in den USA: bei Cal.com,
          Cloudflare, Microsoft, Discord und WhatsApp/Meta auf Grundlage des
          Angemessenheitsbeschlusses der EU-Kommission zum EU-US Data Privacy
          Framework (Art. 45 DSGVO). Für Übermittlungen, die davon nicht erfasst
          sind, enthalten die Verträge mit Cal.com und Cloudflare die
          EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO). Cloudflare
          kann Anfragen außerdem in weiteren Rechenzentren seines weltweiten
          Netzwerks verarbeiten, insbesondere wenn Sie die Website von außerhalb
          der EU aufrufen.
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
        <ProseP>
          Zur Ausübung Ihrer Rechte genügt eine formlose Nachricht an die oben
          genannten Kontaktdaten. Für minderjährige Lernende können die
          Erziehungsberechtigten die Rechte ausüben.
        </ProseP>
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
            <TextLink
              variant="doc"
              href={`mailto:${supervisoryAuthority.email}`}
            >
              {supervisoryAuthority.email}
            </TextLink>
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
          personenbezogener Daten, die auf Grundlage von Art. 6 Abs. 1 lit. f
          DSGVO erfolgt, Widerspruch einzulegen (Art. 21 Abs. 1 DSGVO).
        </ProseP>
        <ProseP>
          Das betrifft insbesondere die Server-Logfiles, die Auslieferung und
          den Schutz über Cloudflare, die Datensicherungen, den Schutz vor
          Missbrauch, die Webanalyse mit Umami, die Aufbewahrung von
          Vertragsnachweisen sowie die Daten von Lernenden, deren
          Erziehungsberechtigte Vertragspartner sind. Nach einem Widerspruch
          verarbeite ich die Daten nicht mehr, es sei denn, ich kann zwingende
          schutzwürdige Gründe für die Verarbeitung nachweisen, die Ihre
          Interessen, Rechte und Freiheiten überwiegen, oder die Verarbeitung
          dient der Geltendmachung, Ausübung oder Verteidigung von
          Rechtsansprüchen. Direktwerbung betreibe ich nicht. Ein formloser
          Widerspruch an{" "}
          <TextLink variant="doc" href={`mailto:${privacyContact.email}`}>
            {privacyContact.email}
          </TextLink>{" "}
          genügt.
        </ProseP>
      </PrivacySection>

      <PrivacySection id="datensicherheit">
        <ProseP>
          Ich nutze technische und organisatorische Sicherheitsmaßnahmen, um
          Ihre Daten gegen Verlust, Zerstörung und unbefugten Zugriff zu
          schützen. Die Übertragung von Daten an diese Website erfolgt
          ausschließlich TLS-verschlüsselt (HTTPS), sowohl zwischen Ihrem
          Browser und Cloudflare als auch zwischen Cloudflare und meinem Server.
          Datensicherungen werden verschlüsselt übertragen und bei Cloudflare
          verschlüsselt gespeichert; die Schlüssel verwaltet Cloudflare.
        </ProseP>
      </PrivacySection>

      <PrivacySection id="aktualitaet">
        <ProseP>
          Diese Datenschutzerklärung ist aktuell gültig und hat den Stand{" "}
          {effectiveDate}. Änderungen können durch Anpassungen meiner Dienste
          oder aufgrund geänderter gesetzlicher Vorgaben notwendig werden.
        </ProseP>
      </PrivacySection>
    </>
  );
}
