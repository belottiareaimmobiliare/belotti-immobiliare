import nodemailer from 'nodemailer'

function createTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || '587')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    throw new Error('Configurazione SMTP mancante')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: {
      user,
      pass,
    },
  })
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatPrice(price: number | null) {
  return typeof price === 'number'
    ? `€ ${price.toLocaleString('it-IT')}`
    : 'Trattativa riservata'
}

function normalizePhoneForTel(phone: string | null) {
  if (!phone) return ''
  return phone.replace(/[^\d+]/g, '')
}

function buildButton(label: string, href: string, dark = true) {
  const bg = dark ? '#0a0f1a' : '#ffffff'
  const color = dark ? '#ffffff' : '#111827'
  const border = dark ? '#0a0f1a' : '#d1d5db'

  return `
    <a href="${href}" style="display:inline-block;padding:11px 16px;background:${bg};color:${color};text-decoration:none;border-radius:12px;border:1px solid ${border};font-size:14px;font-weight:600;">
      ${label}
    </a>
  `
}

export async function sendVerificationEmail({
  to,
  code,
  propertyTitle,
}: {
  to: string
  code: string
  propertyTitle: string
}) {
  const transporter = createTransporter()
  const user = process.env.SMTP_USER as string

  await transporter.sendMail({
    from: `"Belotti Area Immobiliare" <${user}>`,
    to,
    subject: 'Codice verifica richiesta immobile',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;">
        <h2 style="margin-bottom:8px;">Verifica la tua richiesta</h2>
        <p>Hai richiesto informazioni per questo immobile:</p>
        <p><strong>${escapeHtml(propertyTitle)}</strong></p>
        <p>Inserisci questo codice di verifica:</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:10px;margin:20px 0;">
          ${escapeHtml(code)}
        </div>
        <p>Il codice scade tra 10 minuti.</p>
      </div>
    `,
  })
}

export async function sendAgencyLeadNotification({
  propertyTitle,
  propertySlug,
  propertyUrl,
  propertyPrice,
  propertyComune,
  propertyProvince,
  propertyDescription,
  propertyCoverUrl,
  fullName,
  email,
  phone,
  message,
}: {
  propertyTitle: string
  propertySlug: string | null
  propertyUrl: string | null
  propertyPrice: number | null
  propertyComune: string | null
  propertyProvince: string | null
  propertyDescription: string | null
  propertyCoverUrl: string | null
  fullName: string
  email: string
  phone: string | null
  message: string | null
}) {
  const transporter = createTransporter()
  const user = process.env.SMTP_USER as string

  const safeTitle = escapeHtml(propertyTitle || 'Immobile')
  const safeSlug = escapeHtml(propertySlug || '-')
  const safeName = escapeHtml(fullName)
  const safeEmail = escapeHtml(email)
  const safePhone = escapeHtml(phone || '-')
  const safeMessage = escapeHtml(message || 'Nessun messaggio inserito.')
  const safeComune = escapeHtml(propertyComune || '-')
  const safeProvince = escapeHtml(propertyProvince || '-')
  const safeDescription = escapeHtml(
    (propertyDescription || 'Nessuna descrizione disponibile.').slice(0, 450)
  )
  const safeUrl = propertyUrl ? escapeHtml(propertyUrl) : ''
  const formattedPrice = formatPrice(propertyPrice)
  const telHref = normalizePhoneForTel(phone)
    ? `tel:${normalizePhoneForTel(phone)}`
    : ''
  const emailHref = `mailto:${encodeURIComponent(email)}`

  await transporter.sendMail({
    from: `"Belotti Area Immobiliare" <${user}>`,
    to: user,
    subject: `Nuova richiesta immobile: ${safeTitle}`,
    html: `
      <div style="margin:0;padding:24px;background:#f4f6fb;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
          <div style="background:#0a0f1a;padding:24px 28px;">
            <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.08em;">BELOTTI</div>
            <div style="margin-top:6px;font-size:13px;color:#9ca3af;">Area Immobiliare</div>
          </div>

          <div style="padding:28px;">
            <h1 style="margin:0 0 10px;font-size:28px;line-height:1.2;color:#111827;">Nuova richiesta ricevuta</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#4b5563;">
              È arrivata una nuova richiesta di contatto dal sito.
            </p>

            <div style="border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;margin-bottom:24px;">
              ${
                propertyCoverUrl
                  ? `<img src="${escapeHtml(propertyCoverUrl)}" alt="${safeTitle}" style="display:block;width:100%;max-height:300px;object-fit:cover;background:#e5e7eb;" />`
                  : ''
              }

              <div style="padding:22px;">
                <div style="display:inline-block;padding:6px 10px;border:1px solid #d1d5db;border-radius:999px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;margin-bottom:14px;">
                  Richiesta immobile
                </div>

                <h2 style="margin:0 0 10px;font-size:26px;line-height:1.2;color:#111827;">
                  ${safeTitle}
                </h2>

                <p style="margin:0 0 10px;font-size:15px;color:#6b7280;">
                  ${safeComune} (${safeProvince})
                </p>

                <p style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">
                  ${escapeHtml(formattedPrice)}
                </p>

                <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#4b5563;">
                  ${safeDescription}
                </p>

                ${
                  propertyUrl
                    ? buildButton('Apri scheda immobile', safeUrl)
                    : ''
                }
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr;gap:14px;margin-bottom:24px;">
              <div style="padding:18px;border:1px solid #e5e7eb;border-radius:16px;background:#fafafa;">
                <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;margin-bottom:8px;">Nome</div>
                <div style="font-size:15px;color:#111827;">${safeName}</div>
              </div>

              <div style="padding:18px;border:1px solid #e5e7eb;border-radius:16px;background:#fafafa;">
                <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;margin-bottom:8px;">Email</div>
                <div style="font-size:15px;color:#111827;margin-bottom:12px;">${safeEmail}</div>
                ${buildButton('Scrivi email', emailHref, false)}
              </div>

              <div style="padding:18px;border:1px solid #e5e7eb;border-radius:16px;background:#fafafa;">
                <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;margin-bottom:8px;">Cellulare</div>
                <div style="font-size:15px;color:#111827;margin-bottom:12px;">${safePhone}</div>
                ${telHref ? buildButton('Chiama cliente', telHref, false) : ''}
              </div>

              <div style="padding:18px;border:1px solid #e5e7eb;border-radius:16px;background:#fafafa;">
                <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;margin-bottom:8px;">Slug</div>
                <div style="font-size:15px;color:#111827;">${safeSlug}</div>
              </div>
            </div>

            <div style="padding:20px;border:1px solid #e5e7eb;border-radius:16px;background:#fafafa;">
              <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;margin-bottom:10px;">Messaggio</div>
              <div style="font-size:15px;line-height:1.7;color:#111827;white-space:pre-wrap;">${safeMessage}</div>
            </div>
          </div>
        </div>
      </div>
    `,
  })
}

export async function sendCustomerLeadConfirmation({
  to,
  fullName,
  propertyTitle,
  propertyUrl,
}: {
  to: string
  fullName: string
  propertyTitle: string
  propertyUrl: string | null
}) {
  const transporter = createTransporter()
  const user = process.env.SMTP_USER as string

  const safeName = escapeHtml(fullName)
  const safeTitle = escapeHtml(propertyTitle)
  const safeUrl = propertyUrl ? escapeHtml(propertyUrl) : ''

  await transporter.sendMail({
    from: `"Belotti Area Immobiliare" <${user}>`,
    to,
    subject: `Richiesta ricevuta: ${safeTitle}`,
    html: `
      <div style="margin:0;padding:24px;background:#f4f6fb;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
          <div style="background:#0a0f1a;padding:24px 28px;">
            <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.08em;">BELOTTI</div>
            <div style="margin-top:6px;font-size:13px;color:#9ca3af;">Area Immobiliare</div>
          </div>

          <div style="padding:28px;">
            <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;color:#111827;">
              Buongiorno ${safeName},
            </h1>

            <p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:#4b5563;">
              la sua richiesta di informazioni per l’immobile
              <strong style="color:#111827;"> ${safeTitle}</strong>
              è stata ricevuta correttamente.
            </p>

            <p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:#4b5563;">
              Sarà presa in carico da un nostro consulente non appena possibile, compatibilmente con le priorità operative e con le attività già in corso.
            </p>

            <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#4b5563;">
              La ringraziamo per l’interesse dimostrato verso i nostri immobili.
            </p>

            ${
              propertyUrl
                ? buildButton('Rivedi l’immobile', safeUrl)
                : ''
            }

            <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:13px;line-height:1.7;color:#6b7280;">
                Belotti Area Immobiliare<br />
                Questa è una comunicazione automatica di conferma ricezione richiesta.
              </p>
            </div>
          </div>
        </div>
      </div>
    `,
  })
}
export async function sendSavedSearchVerificationEmail({
  to,
  code,
  propertyTitle,
}: {
  to: string
  code: string
  propertyTitle: string
}) {
  const transporter = createTransporter()
  const user = process.env.SMTP_USER as string

  await transporter.sendMail({
    from: `"Belotti Area Immobiliare" <${user}>`,
    to,
    subject: 'Codice verifica ricerca immobili simili',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;">
        <h2 style="margin-bottom:8px;">Verifica la tua ricerca</h2>
        <p>Hai richiesto di essere avvisato per immobili simili a:</p>
        <p><strong>${escapeHtml(propertyTitle)}</strong></p>
        <p>Inserisci questo codice di verifica:</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:10px;margin:20px 0;">
          ${escapeHtml(code)}
        </div>
        <p>Il codice scade tra 10 minuti.</p>
      </div>
    `,
  })
}

export async function sendAgencySavedSearchNotification({
  fullName,
  email,
  phone,
  sourcePropertyTitle,
  propertyUrl,
  contractType,
  macroCategory,
  location,
  priceRange,
  surfaceRange,
  roomsRange,
}: {
  fullName: string
  email: string
  phone: string | null
  sourcePropertyTitle: string
  propertyUrl: string | null
  contractType: string
  macroCategory: string
  location: string
  priceRange: string
  surfaceRange: string
  roomsRange: string
}) {
  const transporter = createTransporter()
  const user = process.env.SMTP_USER as string

  const safeName = escapeHtml(fullName)
  const safeEmail = escapeHtml(email)
  const safePhone = escapeHtml(phone || '-')
  const safeTitle = escapeHtml(sourcePropertyTitle)
  const safeUrl = propertyUrl ? escapeHtml(propertyUrl) : ''

  await transporter.sendMail({
    from: `"Belotti Area Immobiliare" <${user}>`,
    to: user,
    subject: `Nuova ricerca salvata: ${safeName}`,
    html: `
      <div style="margin:0;padding:24px;background:#f4f6fb;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
          <div style="background:#0a0f1a;padding:24px 28px;">
            <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.08em;">BELOTTI</div>
            <div style="margin-top:6px;font-size:13px;color:#9ca3af;">Area Immobiliare</div>
          </div>

          <div style="padding:28px;">
            <h1 style="margin:0 0 10px;font-size:28px;line-height:1.2;color:#111827;">
              Nuova ricerca salvata
            </h1>

            <p style="margin:0 0 24px;font-size:15px;color:#4b5563;">
              Un utente vuole essere avvisato quando saranno disponibili immobili simili.
            </p>

            <div style="padding:20px;border:1px solid #e5e7eb;border-radius:16px;background:#fafafa;margin-bottom:20px;">
              <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;margin-bottom:8px;">Cliente</div>
              <p style="margin:0 0 8px;font-size:15px;color:#111827;"><strong>${safeName}</strong></p>
              <p style="margin:0 0 8px;font-size:15px;color:#111827;">Email: ${safeEmail}</p>
              <p style="margin:0;font-size:15px;color:#111827;">Telefono: ${safePhone}</p>
            </div>

            <div style="padding:20px;border:1px solid #e5e7eb;border-radius:16px;background:#fafafa;margin-bottom:20px;">
              <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;margin-bottom:8px;">Immobile di partenza</div>
              <p style="margin:0 0 12px;font-size:18px;color:#111827;"><strong>${safeTitle}</strong></p>
              ${propertyUrl ? buildButton('Apri scheda immobile', safeUrl) : ''}
            </div>

            <div style="padding:20px;border:1px solid #e5e7eb;border-radius:16px;background:#fafafa;">
              <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;margin-bottom:12px;">Criteri indicativi</div>
              <p style="margin:0 0 8px;font-size:15px;color:#111827;">Contratto: ${escapeHtml(contractType)}</p>
              <p style="margin:0 0 8px;font-size:15px;color:#111827;">Categoria: ${escapeHtml(macroCategory)}</p>
              <p style="margin:0 0 8px;font-size:15px;color:#111827;">Zona: ${escapeHtml(location)}</p>
              <p style="margin:0 0 8px;font-size:15px;color:#111827;">Prezzo: ${escapeHtml(priceRange)}</p>
              <p style="margin:0 0 8px;font-size:15px;color:#111827;">Superficie: ${escapeHtml(surfaceRange)}</p>
              <p style="margin:0;font-size:15px;color:#111827;">Locali: ${escapeHtml(roomsRange)}</p>
            </div>
          </div>
        </div>
      </div>
    `,
  })
}

export async function sendCustomerSavedSearchConfirmation({
  to,
  fullName,
  sourcePropertyTitle,
  unsubscribeUrl,
}: {
  to: string
  fullName: string
  sourcePropertyTitle: string
  unsubscribeUrl: string | null
}) {
  const transporter = createTransporter()
  const user = process.env.SMTP_USER as string

  await transporter.sendMail({
    from: `"Belotti Area Immobiliare" <${user}>`,
    to,
    subject: 'Ricerca immobili simili attivata',
    html: `
      <div style="margin:0;padding:24px;background:#f4f6fb;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
          <div style="background:#0a0f1a;padding:24px 28px;">
            <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.08em;">BELOTTI</div>
            <div style="margin-top:6px;font-size:13px;color:#9ca3af;">Area Immobiliare</div>
          </div>

          <div style="padding:28px;">
            <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;color:#111827;">
              Buongiorno ${escapeHtml(fullName)},
            </h1>

            <p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:#4b5563;">
              la sua ricerca per immobili simili a
              <strong style="color:#111827;"> ${escapeHtml(sourcePropertyTitle)}</strong>
              è stata attivata correttamente.
            </p>

            <p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:#4b5563;">
              Quando saranno disponibili immobili coerenti per zona, fascia di prezzo e caratteristiche principali, potrà essere ricontattato dall’agenzia.
            </p>

            ${buildUnsubscribeBlock(unsubscribeUrl)}

            <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:13px;line-height:1.7;color:#6b7280;">
                Belotti Area Immobiliare<br />
                Questa è una comunicazione automatica di conferma.
              </p>
            </div>
          </div>
        </div>
      </div>
    `,
  })
}

export async function sendSavedSearchDigestEmail({
  to,
  fullName,
  sourcePropertyTitle,
  matches,
  unsubscribeUrl,
}: {
  to: string
  fullName: string
  sourcePropertyTitle: string
  unsubscribeUrl: string | null
  matches: Array<{
    title: string
    url: string
    price: number | null
    comune: string | null
    province: string | null
    surface: number | null
    rooms: number | null
    coverUrl: string | null
  }>
}) {
  const transporter = createTransporter()
  const user = process.env.SMTP_USER as string

  const safeName = escapeHtml(fullName)
  const safeSourceTitle = escapeHtml(sourcePropertyTitle)

  const cards = matches
    .map((item) => {
      const safeTitle = escapeHtml(item.title)
      const safeUrl = escapeHtml(item.url)
      const safeComune = escapeHtml(item.comune || '-')
      const safeProvince = escapeHtml(item.province || '-')
      const price = formatPrice(item.price)
      const details = [
        item.surface ? `${item.surface} mq` : null,
        item.rooms ? `${item.rooms} locali` : null,
      ]
        .filter(Boolean)
        .join(' · ')

      return `
        <div style="border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;margin-bottom:18px;background:#ffffff;">
          ${
            item.coverUrl
              ? `<img src="${escapeHtml(item.coverUrl)}" alt="${safeTitle}" style="display:block;width:100%;max-height:260px;object-fit:cover;background:#e5e7eb;" />`
              : ''
          }

          <div style="padding:20px;">
            <h2 style="margin:0 0 8px;font-size:22px;line-height:1.25;color:#111827;">
              ${safeTitle}
            </h2>

            <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">
              ${safeComune} (${safeProvince})
            </p>

            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
              ${escapeHtml(price)}
            </p>

            ${
              details
                ? `<p style="margin:0 0 16px;font-size:14px;color:#4b5563;">${escapeHtml(details)}</p>`
                : ''
            }

            ${buildButton('Apri immobile', safeUrl)}
          </div>
        </div>
      `
    })
    .join('')

  await transporter.sendMail({
    from: `"Belotti Area Immobiliare" <${user}>`,
    to,
    subject: 'Nuovi immobili simili alla tua ricerca',
    html: `
      <div style="margin:0;padding:24px;background:#f4f6fb;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
          <div style="background:#0a0f1a;padding:24px 28px;">
            <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.08em;">BELOTTI</div>
            <div style="margin-top:6px;font-size:13px;color:#9ca3af;">Area Immobiliare</div>
          </div>

          <div style="padding:28px;">
            <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;color:#111827;">
              Buongiorno ${safeName},
            </h1>

            <p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:#4b5563;">
              abbiamo trovato nuovi immobili che potrebbero essere coerenti con la ricerca salvata a partire da:
              <strong style="color:#111827;"> ${safeSourceTitle}</strong>.
            </p>

            <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#4b5563;">
              Li trova qui sotto. Può aprire ogni scheda e richiedere maggiori informazioni direttamente all’agenzia.
            </p>

            ${cards}

            ${buildUnsubscribeBlock(unsubscribeUrl)}

            <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:13px;line-height:1.7;color:#6b7280;">
                Belotti Area Immobiliare<br />
                Questa comunicazione viene inviata solo quando sono presenti nuovi immobili coerenti con la ricerca salvata.
              </p>
            </div>
          </div>
        </div>
      </div>
    `,
  })
}

export async function sendSavedSearchNoResultsAdviceEmail({
  to,
  fullName,
  sourcePropertyTitle,
  contactUrl,
  unsubscribeUrl,
}: {
  to: string
  fullName: string
  sourcePropertyTitle: string
  contactUrl: string
  unsubscribeUrl: string | null
}) {
  const transporter = createTransporter()
  const user = process.env.SMTP_USER as string

  await transporter.sendMail({
    from: `"Belotti Area Immobiliare" <${user}>`,
    to,
    subject: 'La tua ricerca immobiliare: possiamo aiutarti a migliorarla',
    html: `
      <div style="margin:0;padding:24px;background:#f4f6fb;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
          <div style="background:#0a0f1a;padding:24px 28px;">
            <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.08em;">BELOTTI</div>
            <div style="margin-top:6px;font-size:13px;color:#9ca3af;">Area Immobiliare</div>
          </div>

          <div style="padding:28px;">
            <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;color:#111827;">
              Buongiorno ${escapeHtml(fullName)},
            </h1>

            <p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:#4b5563;">
              negli ultimi giorni non sono stati pubblicati nuovi immobili sufficientemente simili alla ricerca salvata a partire da
              <strong style="color:#111827;"> ${escapeHtml(sourcePropertyTitle)}</strong>.
            </p>

            <p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:#4b5563;">
              Può essere utile ampliare leggermente i parametri di ricerca, valutare zone vicine oppure confrontarsi con l’agenzia per capire insieme quali soluzioni possano rispondere meglio alle sue esigenze.
            </p>

            <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#4b5563;">
              Se desidera, può contattarci per una consulenza gratuita e senza impegno.
            </p>

            ${buildButton('Contatta Area Immobiliare', escapeHtml(contactUrl))}

            ${buildUnsubscribeBlock(unsubscribeUrl)}

            <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:13px;line-height:1.7;color:#6b7280;">
                Belotti Area Immobiliare<br />
                Questa comunicazione viene inviata solo quando per alcuni giorni non emergono nuovi immobili coerenti con la ricerca salvata.
              </p>
            </div>
          </div>
        </div>
      </div>
    `,
  })
}


function buildUnsubscribeBlock(unsubscribeUrl: string | null) {
  if (!unsubscribeUrl) return ''

  return `
    <div style="margin-top:22px;padding-top:18px;border-top:1px solid #e5e7eb;">
      <p style="margin:0 0 10px;font-size:13px;line-height:1.7;color:#6b7280;">
        Non desideri più ricevere aggiornamenti per questa ricerca?
      </p>
      <a href="${escapeHtml(unsubscribeUrl)}" style="font-size:13px;color:#6b7280;text-decoration:underline;">
        Disattiva questa ricerca salvata
      </a>
    </div>
  `
}

export async function sendKpiCleanupVerificationEmail({
  to,
  code,
  adminName,
}: {
  to: string
  code: string
  adminName: string
}) {
  const transporter = createTransporter()
  const user = process.env.SMTP_USER as string

  await transporter.sendMail({
    from: `"Belotti Area Immobiliare" <${user}>`,
    to,
    subject: 'Codice conferma pulizia KPI',
    html: `
      <div style="margin:0;padding:24px;background:#f4f6fb;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
          <div style="background:#0a0f1a;padding:24px 28px;">
            <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.08em;">BELOTTI</div>
            <div style="margin-top:6px;font-size:13px;color:#9ca3af;">Area Immobiliare</div>
          </div>

          <div style="padding:28px;">
            <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;color:#111827;">
              Conferma pulizia KPI
            </h1>

            <p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:#4b5563;">
              È stata richiesta una pulizia dello storico KPI dall’utente amministratore:
              <strong style="color:#111827;"> ${escapeHtml(adminName)}</strong>.
            </p>

            <p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:#4b5563;">
              Per confermare l’operazione, inserisci questo codice nel pannello admin:
            </p>

            <div style="font-size:34px;font-weight:800;letter-spacing:10px;margin:22px 0;color:#111827;">
              ${escapeHtml(code)}
            </div>

            <p style="margin:0;font-size:14px;line-height:1.7;color:#6b7280;">
              Il codice scade tra 10 minuti. Se non hai richiesto tu questa operazione, ignora questa email.
            </p>
          </div>
        </div>
      </div>
    `,
  })
}
