# Mosaico

Galeria de fotos no estilo mural (masonry): descubra imagens, favorite, envie as suas e compartilhe.

## Como rodar

```bash
npm install
cp .env.example .env   # preencha conforme abaixo
npm run dev
```

| Comando         | O que faz                       |
| --------------- | ------------------------------- |
| `npm run dev`   | servidor de desenvolvimento     |
| `npm run build` | build de produção em `dist/`    |
| `npm test`      | testes (Vitest)                 |

## Dois modos

**Modo local** (sem Supabase): nada para configurar além de `VITE_PEXELS_API_KEY` (opcional, só para ver fotos do Pexels em dev). Fotos enviadas e favoritos ficam no `localStorage` do navegador, sem contas.

**Modo com contas** (Supabase): defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Habilita login, upload real de arquivos, favoritos por conta e fotos públicas visíveis para todos.

### Configurando o Supabase

1. Crie um projeto em supabase.com.
2. Aplique [supabase/migrations/20261015000000_init_mosaico.sql](supabase/migrations/20261015000000_init_mosaico.sql) (SQL Editor ou `supabase db push`). Cria tabelas, políticas RLS e o bucket `photos`.
3. Publique o proxy do Pexels (a chave nunca vai para o navegador):
   ```bash
   supabase functions deploy pexels
   supabase secrets set PEXELS_API_KEY=sua_chave
   ```
4. Copie URL e anon key (Project Settings → API) para o `.env`.

## Arquitetura

```
src/
  app/            composição: providers + tela principal
  components/     UI genérica (Header, Dialog, Toast, ...)
  features/
    auth/         sessão e diálogo de login
    photos/       modelo, feed, biblioteca, masonry, viewer, upload
  hooks/          useTheme, useDebouncedValue, useInfiniteScroll, ...
  lib/            env, cliente Supabase, tratamento de imagem
  services/
    pexels.js     fonte externa (via Edge Function)
    repository/   contrato único com 2 adaptadores: local e remoto
supabase/         migração SQL e Edge Function
```

Decisões principais:

- **Repositório com dois adaptadores**: a UI não sabe se os dados vêm do navegador ou do Supabase. Trocar de backend é trocar um arquivo.
- **Modelo único de foto** (`features/photos/model.js`): Pexels, uploads e favoritos usam o mesmo formato.
- **Masonry estável**: fotos são distribuídas em colunas por altura; carregar mais não reorganiza as já exibidas. `aspect-ratio` evita saltos de layout.
- **Escala**: scroll infinito paginado, `loading="lazy"`, requisições canceladas ao trocar de busca, imagens reduzidas no cliente antes do upload (e sem EXIF), proxy com cache de 5 min.
- **Segurança**: RLS em todas as tabelas, uploads restritos à pasta do próprio usuário, chave do Pexels só no servidor.
- **Identidade**: tokens de cor em CSS (`styles/index.css`) alimentam o Tailwind e o tema escuro; tipografia Fraunces + DM Sans.

## Observação sobre o ambiente

Em máquinas Windows com política de *Application Control* que bloqueia binários nativos, o Rollup falha ao carregar. Por isso o `package.json` usa `overrides` para o `@rollup/wasm-node` (mesma API, um pouco mais lento no build). Em outros ambientes pode ser removido.
