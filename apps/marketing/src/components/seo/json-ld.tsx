import { brand } from "@/content/site";
import { legalContact } from "@/content/legal-contact";
import { contactDetails } from "@/content/contact";
import { socials } from "@/content/socials";
import { SITE_URL } from "@/lib/routes";

// legalContact.city is "77963 Schwanau" -> split into postal code + locality.
const [postalCode, ...localityParts] = legalContact.city.split(" ");
const addressLocality = localityParts.join(" ");

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["EducationalOrganization", "LocalBusiness"],
  "@id": `${SITE_URL}/#business`,
  name: brand.name,
  url: SITE_URL,
  description:
    "Persönliche Online-Nachhilfe in Mathematik, Informatik und Physik – ohne Mindestlaufzeit, 30 € pro 60 Minuten.",
  founder: { "@type": "Person", name: legalContact.ownerName },
  email: contactDetails.eMail.content,
  telephone: legalContact.phone,
  address: {
    "@type": "PostalAddress",
    streetAddress: legalContact.street,
    postalCode,
    addressLocality,
    addressCountry: "DE",
  },
  areaServed: { "@type": "Country", name: "Deutschland" },
  knowsAbout: ["Mathematik", "Informatik", "Physik"],
  priceRange: "30 € pro 60 Minuten",
  makesOffer: {
    "@type": "Offer",
    price: "30",
    priceCurrency: "EUR",
    itemOffered: {
      "@type": "Service",
      name: "Nachhilfe (60 Minuten)",
      serviceType: "Online-Nachhilfe",
    },
  },
  // Contact and invite links are not stable social profiles.
  sameAs: socials
    .filter((social) => !["whatsapp", "discord"].includes(social.key))
    .map((social) => social.href),
};

/** Site-wide Organization/LocalBusiness structured data for search engines. */
export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
