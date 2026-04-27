import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

function htmlPage({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0f1a;
      color: #ffffff;
      font-family: Arial, sans-serif;
      padding: 24px;
    }
    .card {
      max-width: 640px;
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 28px;
      background: rgba(255,255,255,.05);
      padding: 32px;
      box-shadow: 0 24px 80px rgba(0,0,0,.35);
    }
    h1 {
      margin: 0 0 14px;
      font-size: 30px;
      line-height: 1.2;
    }
    p {
      margin: 0 0 24px;
      color: rgba(255,255,255,.72);
      line-height: 1.7;
      font-size: 16px;
    }
    a {
      display: inline-block;
      color: #0a0f1a;
      background: #ffffff;
      text-decoration: none;
      border-radius: 999px;
      padding: 12px 18px;
      font-weight: 700;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <main class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/">Torna al sito</a>
  </main>
</body>
</html>`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = String(searchParams.get('token') || '').trim()

  if (!token) {
    return new NextResponse(
      htmlPage({
        title: 'Link non valido',
        message: 'Non è stato possibile trovare la ricerca da disattivare.',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('saved_searches')
    .update({
      status: 'archived',
      closed_at: new Date().toISOString(),
    })
    .eq('unsubscribe_token', token)
    .in('status', ['new', 'contacted'])
    .select('id')
    .maybeSingle()

  if (error) {
    return new NextResponse(
      htmlPage({
        title: 'Errore',
        message: 'Si è verificato un errore durante la disattivazione della ricerca.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }

  if (!data) {
    return new NextResponse(
      htmlPage({
        title: 'Ricerca già disattivata',
        message: 'Questa ricerca non risulta più attiva oppure è già stata disattivata.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }

  return new NextResponse(
    htmlPage({
      title: 'Ricerca disattivata',
      message:
        'La ricerca salvata è stata disattivata correttamente. Non riceverai più aggiornamenti automatici per questa richiesta.',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  )
}
