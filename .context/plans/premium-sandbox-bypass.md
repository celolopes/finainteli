# Premium Sandbox/TestFlight Bypass & Purchase Activation Fix Plan

> Investigar por que a compra Premium em Sandbox/TestFlight não liberou os recursos nas telas de `reports.tsx`, `chat.tsx` e `index.tsx`, e implementar um bypass de bloqueio Premium para ambientes de TestFlight/DEV/Beta, mantendo o bloqueio ativo apenas em produção.

## Task Snapshot
- **Primary goal:** Garantir que compras Premium em Sandbox/TestFlight liberem as features e que o bloqueio Premium seja desativado automaticamente em ambientes não‑produção (TestFlight, `__DEV__`, beta/preview).
- **Success signal:**
  - Em TestFlight, no canal `preview` e em builds `__DEV__`, todas as features Premium ficam acessíveis sem paywall.
  - Em produção, o paywall permanece ativo e só libera após confirmação de entitlement/purchase.
  - Logs confirmam atualização do estado Premium após compra.
- **Key references:**
  - `.context/docs/README.md`
  - `.context/agents/README.md`
  - `CONTRIBUTING.md`

## Codebase Context
- Hook principal de acesso Premium: `src/hooks/usePremium.ts`.
- Serviço de compras: `src/services/revenuecat.ts` (classe `RevenueCatService`).
- Gate de UI: `src/components/paywall/PaywallGate.tsx` e chamadas em `app/(app)/(tabs)/reports.tsx`, `app/(app)/(tabs)/chat.tsx`, `app/(app)/(tabs)/index.tsx`.
- Possíveis flags de ambiente/config: `constants/`, `src/constants/`, `app/(app)/settings/debug`, `app/(app)/settings/security`.

## Agent Lineup
- **Bug Fixer:** mapear fluxo atual de compra e identificar por que o estado Premium não atualizou após o sandbox purchase.
- **Mobile Specialist:** validar diferenciação de ambiente (TestFlight, beta, produção) no iOS/Expo.
- **Feature Developer:** implementar bypass de bloqueio Premium em ambientes não‑produção e corrigir atualização de estado pós‑compra.
- **Test Writer:** adicionar/ajustar testes de `usePremium`/paywall e cenários de ambiente.
- **Code Reviewer:** revisar riscos de bypass em produção e garantir clareza da lógica de ambiente.

## Risk Assessment
### Identified Risks
- **Risco:** detecção incorreta de ambiente liberar Premium em produção.
  - **Probabilidade:** Média
  - **Impacto:** Alto
  - **Mitigação:** usar múltiplos sinais (ex.: `__DEV__`, `expo-updates` channel, `appOwnership`, build config) e exigir confirmação explícita para produção.
- **Risco:** estado Premium não sincroniza após compra e fica travado em “não‑premium”.
  - **Probabilidade:** Média
  - **Impacto:** Médio
  - **Mitigação:** centralizar atualização de entitlements, garantir listener de customer info, e criar fallback de refresh on‑focus.

### Dependencies
- **Externa:** RevenueCat / StoreKit sandbox (TestFlight).
- **Interna:** hooks de estado global (`useStore`) e configuração de ambientes.

### Assumptions
- O estado Premium é determinado em `usePremium` e propagado para as telas via hook/componente gate.
- Existe sinal de ambiente confiável para diferenciar produção de TestFlight/beta/preview (expo-updates channel, `appOwnership`, build config com `EXPO_PUBLIC_ENV=preview` e `__DEV__`).
- Se essas suposições falharem, a fase de descoberta deve ajustar o plano.

## Resource Estimation
- **Phase 1 (Discovery):** 0,5–1 dia
- **Phase 2 (Implementation):** 1–2 dias
- **Phase 3 (Validation):** 0,5–1 dia

## Working Phases
### Phase 1 — Discovery & Alignment (P)
1. Mapear fluxo de compra Premium: ponto de início da compra, retorno de sucesso, atualização de entitlements e persistência local.
2. Inspecionar `usePremium` e `RevenueCatService` para checar:
   - onde e quando os entitlements são lidos
   - se existe listener de mudanças (`customerInfo`) e refresh após compra
   - se a UI bloqueia por estado “cached” ou falta de revalidação
3. Identificar como cada tela aplica o bloqueio (`PaywallGate`, `premiumOnly`, etc.).
4. Validar sinais de ambiente disponíveis no app (TestFlight, beta/preview, `__DEV__`, updates channel, `EXPO_PUBLIC_ENV`, build config, `appOwnership`).
5. Registrar logs necessários para reproduzir o problema no TestFlight.

**Checkpoint (Phase 1):**
- Documento de hipóteses e evidências do porquê a compra não liberou.
- Caminhos de código críticos mapeados (arquivos e funções responsáveis).

### Phase 2 — Implementation & Iteration (E)
1. Criar/centralizar uma função `isPremiumBypassEnabled()` (ou similar) em `src/constants` ou `src/utils` que responda `true` em:
   - `__DEV__`
   - TestFlight
   - canal `preview` (expo-updates) e demais canais/bundles identificados como beta
   - `appOwnership` não‑produção, quando aplicável
   - `EXPO_PUBLIC_ENV=preview` como override explícito
2. Ajustar `usePremium` para:
   - se `isPremiumBypassEnabled()` for `true`, retornar `isPremium: true` e pular bloqueios
   - manter o fluxo de entitlements normal em produção
3. Garantir atualização de estado após compra:
   - listener de customer info (RevenueCat)
   - refresh explícito depois do purchase
   - fallback de refresh em foco/reopen das telas
4. Atualizar `PaywallGate` ou demais checks para usarem o estado centralizado de `usePremium`.
5. Adicionar logs defensivos apenas em dev/beta para diagnosticar novos casos.

**Checkpoint (Phase 2):**
- Bypass ativo e testável em TestFlight/DEV/beta.
- Estado Premium atualiza após compra no sandbox.

### Phase 3 — Validation & Handoff (V)
1. Rodar `npm run build && npm run test` (e `npm run test -- --watch` se necessário).
2. Validar manualmente:
   - TestFlight sandbox: features liberadas sem paywall
   - Produção (simulada): paywall continua bloqueando sem entitlement
3. Atualizar documentação técnica se houver nova flag de ambiente.
4. Capturar evidências: logs, prints e output relevante.

**Checkpoint (Phase 3):**
- Evidência de funcionamento em TestFlight/DEV/beta e preservação do bloqueio em produção.

## Rollback Plan
- Reverter a função de bypass e restaurar lógica anterior de `usePremium`.
- Remover flags de ambiente introduzidas.
- Validar produção novamente após rollback.

## Evidence & Follow-up
- Logs de purchase/entitlements no TestFlight.
- Prints das telas `reports`, `chat`, `index` sem paywall em TestFlight.
- Resultado de `npm run build && npm run test`.
- Lista de mudanças em `usePremium`, `revenuecat.ts`, `PaywallGate`.
