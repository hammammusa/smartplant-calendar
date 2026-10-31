# SmartPlant Calendar — project rules

@AGENTS.md

Arabic-first agricultural planning platform (Palestine / Levant). Next.js 16 App Router, React 19, TypeScript strict, Tailwind 4, Supabase, Zod 4, React Hook Form.

## Non-negotiables

1. **100% Arabic UI.** Every visible string, error, empty/loading state, aria-label and toast is Arabic. English is allowed only in code identifiers, comments, file names, brand names (Open-Meteo, Supabase) and scientific crop names. The e2e helper `expectNoStrayEnglish` enforces this — extend its allow-list only for brand/scientific names.
2. **RTL everywhere.** Use logical utilities (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`). "Previous" arrows point right (`ChevronRight`), "next" arrows point left. Grids that hold wide content need `grid-cols-1` (minmax(0,1fr)) at the base breakpoint, or phones overflow.
3. **No fake data.** No invented statistics, testimonials, notifications or saves. Illustrative content must be labelled «مثال توضيحي». Guest data lives in localStorage and the UI must say so (`StorageNotice`).
4. **Agricultural honesty.** Seed crop data is `dataStatus: "preliminary"`. Never present plans as definitive; unknown growth periods stay `null` (no invented harvest date). Irrigation is "check soil moisture", never inferred from temperature alone.
5. **Security is server/DB side.** Hiding buttons is not protection. Every server action: Zod parse → `supabase.auth.getUser()` → query as the user (RLS). Admin actions also check `profiles.role` and RLS `is_admin()` enforces it again. Never add a service-role key.

## Where things live

- `src/domain/` pure business logic (plan generator, windows, tasks, weather alerts, Zod schemas, Arabic labels). Keep framework-free and unit-tested.
- `src/lib/dates.ts` date-only math on `YYYY-MM-DD` strings; "today" via `todayInTimeZone` (default `Asia/Hebron`). Never use `new Date("YYYY-MM-DD")` for scheduling.
- `src/lib/format.ts` Arabic formatting (Levant month names, Western digits via `NUMBER_LOCALE`, plurals).
- `src/components/providers/app-data-provider.tsx` single client data source; switches between guest (localStorage) and signed-in (server actions).
- `src/actions/` server actions; `src/services/` server-side reads.
- `supabase/migrations/` schema + RLS; `supabase/seed.sql` is **generated** from `src/data` by `npm run db:seed:generate` — edit the TS data, then regenerate.
- Design tokens: `src/app/globals.css` (`:root` vars → `@theme inline`). Change colours there, not in components.

## Next.js 16 notes

- `middleware` is now `src/proxy.ts`.
- `params` / `searchParams` / `cookies()` are async.
- Cache Components is **off** (classic caching: `revalidate` exports, `revalidatePath`). Admin routes are `force-dynamic`.
- Client components using `useSearchParams` must be wrapped in `<Suspense>`.
- React Compiler lint rules are on: no synchronous `setState` in effects (derive state or reset during render), use `useWatch` instead of `form.watch`.

## Checks before committing

```bash
npm run lint && npm run typecheck && npm test
npm run test:db          # RLS tests on a throwaway PostgreSQL
npm run build && npm run test:e2e
```
Do not claim a check passed unless you ran it.
