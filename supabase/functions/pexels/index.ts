// Proxy do Pexels: mantém a chave no servidor (secret PEXELS_API_KEY) e limita os parâmetros.
// Deploy: supabase functions deploy pexels && supabase secrets set PEXELS_API_KEY=...

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
};

const clamp = (value: string | null, min: number, max: number, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : fallback;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const key = Deno.env.get('PEXELS_API_KEY');
  if (!key) return Response.json({ error: 'PEXELS_API_KEY ausente' }, { status: 500, headers: cors });

  const input = new URL(req.url).searchParams;
  const query = (input.get('query') ?? '').trim().slice(0, 100);
  const params = new URLSearchParams({
    page: String(clamp(input.get('page'), 1, 100, 1)),
    per_page: String(clamp(input.get('per_page'), 1, 40, 24)),
    locale: input.get('locale') === 'en-US' ? 'en-US' : 'pt-BR',
  });
  if (query) params.set('query', query);

  const upstream = await fetch(`https://api.pexels.com/v1/${query ? 'search' : 'curated'}?${params}`, {
    headers: { Authorization: key },
  });
  if (!upstream.ok) {
    return Response.json({ error: 'Falha no Pexels' }, { status: 502, headers: cors });
  }

  return new Response(upstream.body, {
    headers: {
      ...cors,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300', // 5 min: reduz chamadas e protege a cota do Pexels
    },
  });
});
