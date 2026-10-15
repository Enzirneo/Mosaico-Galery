# Mosaico

Galeria de fotos no estilo mural (masonry): descubra imagens, favorite, envie as suas, organize em álbuns e compartilhe.

## Ambientes e fluxo de Git

O código é o mesmo em todos os ambientes. **Quem decide para onde ele aponta são as variáveis de ambiente**, não a branch.

| Ambiente | Branch | Como roda | Banco |
| --- | --- | --- | --- |
| Desenvolvimento | `feature/*` → `dev` | `npm run dev` | Supabase **local** (Docker) |
| Produção | `main` | build + hospedagem | Supabase **Mosaico** (nuvem) |

```
feature/xyz  ──►  dev  ──►  main
 (trabalho)     (integra e   (o que está no ar)
                 testa local)
```

- Todo trabalho nasce em `feature/*` a partir de `dev` e volta por merge/PR.
- `dev` só é promovido a `main` depois de `npm test` e `npm run db:test` passarem.
- **Mudança no banco = arquivo novo em `supabase/migrations/`**, nunca edição manual. Primeiro roda no Docker (`npm run db:reset`), depois vai à produção.
- O Vite escolhe o `.env` pelo modo: `npm run dev` usa `.env.development` (banco local); o build de produção usa as variáveis da hospedagem (veja `.env.production.example`).

**Travas de segurança** (`src/lib/env.js`): o modo desenvolvimento se recusa a falar com um banco remoto, e o build de produção se recusa a embutir endereço local. Em dev aparece um selo amarelo "DEV" na tela. A chave do Pexels só existe em desenvolvimento e nunca entra no bundle de produção.

## Primeira vez (desenvolvimento)

Pré-requisitos: Node 20+ e Docker Desktop **aberto**.

```bash
npm install
cp .env.example .env.local     # opcional: coloque VITE_PEXELS_API_KEY para ver fotos do Pexels
npm run db:start               # sobe o Supabase local (1ª vez baixa imagens e demora)
npm run dev                    # http://localhost:5173
```

Contas de teste: o e-mail de confirmação local chega no Mailpit, em http://127.0.0.1:54324 (a confirmação já vem desligada no ambiente local). O painel do banco local fica em http://127.0.0.1:54323.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | app em desenvolvimento (banco local) |
| `npm run build` | build de produção em `dist/` |
| `npm test` | testes unitários (Vitest) |
| `npm run db:start` / `db:stop` | liga / desliga o Supabase local |
| `npm run db:reset` | recria o banco local do zero a partir das migrações |
| `npm run db:test` | 37 testes de segurança (RLS) contra o banco local |

Para rodar o `db:test`: `SUPABASE_ANON_KEY=<ANON_KEY de "npx supabase status"> npm run db:test`.

## Produção

1. Variáveis na hospedagem: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (chave *anon*, que é pública; quem protege os dados é a RLS).
2. Migrações: aplicadas no projeto Mosaico na ordem dos arquivos de `supabase/migrations/`.
3. Edge Function `pexels` publicada e o segredo `PEXELS_API_KEY` cadastrado em *Edge Functions → Secrets* (a chave fica só no servidor).

## Arquitetura

```
src/
  app/            composição: providers + tela principal
  components/     UI genérica (Header, Dialog, Toast, EnvBadge...)
  features/
    auth/         sessão e diálogo de login
    photos/       modelo, feed, biblioteca, masonry, viewer, upload
  hooks/          useTheme, useDebouncedValue, useInfiniteScroll...
  lib/            env (com travas), cliente Supabase, tratamento de imagem
  services/
    pexels.js     fonte externa
    repository/   contrato único com 2 adaptadores: local (navegador) e remoto (Supabase)
supabase/
  migrations/     o banco, em módulos (core_*, mosaico_*)
  functions/      Edge Function pexels
scripts/          teste de segurança do banco
```

### Banco: 5 tabelas, nenhuma específica de foto

| Tabela | Papel |
| --- | --- |
| `profiles` | a pessoa (criada automaticamente no cadastro) |
| `items` | **qualquer conteúdo**: foto, álbum, e no futuro receita, vídeo... (`kind`), com `privacy` = `private` / `unlisted` / `public`, `tags` e `metadata` livre |
| `item_links` | "este item está dentro daquele" (foto em álbum) |
| `reactions` | uma pessoa reagiu a um item (favorito hoje, curtida amanhã) |
| `follows` | quem segue quem |

Um tipo novo de conteúdo é um novo valor em `items.kind`: não exige migração. As migrações `core_*` servem para qualquer projeto; só `mosaico_*` é específica daqui.

Segurança: RLS em todas as tabelas; acesso liberado coluna a coluna (dono, origem e datas nunca vêm do cliente); arquivos num bucket **fechado** acessado por links temporários; cota de itens por conta; fotos do Pexels só aceitam imagens do domínio do Pexels.

### Decisões do app

- **Repositório com dois adaptadores**: a UI não sabe se os dados vêm do navegador ou do Supabase.
- **Modelo único de foto** (`features/photos/model.js`): Pexels, uploads e favoritos usam o mesmo formato.
- **Masonry estável**: fotos distribuídas em colunas por altura; carregar mais não reorganiza as já exibidas.
- **Escala**: scroll infinito paginado, `loading="lazy"`, requisições canceladas ao trocar de busca, imagens reduzidas no cliente (e sem EXIF) antes do upload, proxy do Pexels com cache de 5 min.

## Observação sobre o ambiente Windows

Em máquinas com política de *Application Control* que bloqueia binários nativos, o Rollup falha ao carregar. Por isso o `package.json` usa `overrides` para o `@rollup/wasm-node` (mesma API). Em outros ambientes pode ser removido.
