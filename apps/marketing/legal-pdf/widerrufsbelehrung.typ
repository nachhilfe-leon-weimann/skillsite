// The withdrawal notice with the model withdrawal form as PDF (`just legal-pdfs`). Same wording as the withdrawal
// section of /agb, paragraph by paragraph: src/content/legal/agb-pdf.test.tsx fails until both match.
#import "template.typ": *

#show: legal-document.with(
  title: "Widerrufsbelehrung und Muster-Widerrufsformular",
  subtitle: [für Nachhilfeverträge mit #provider.businessName],
)

#include "parts/withdrawal-intro.typ"

#notice-box(include "parts/withdrawal-notice.typ")

#include "parts/withdrawal-expiry.typ"

#pagebreak()

#notice-box(include "parts/withdrawal-form.typ")
