# Plano de evolução enterprise — 4 fases

Executar em **fases sequenciais** para não quebrar o sistema. Cada fase termina num estado funcional e testável.

---

## FASE 1 — Novos roles + audit hardening
**Migrações DB:**
- Adicionar valores ao enum `app_role`: `VALIDADOR_PROVINCIAL`, `AUDITOR`
- Atualizar `can_access_school()` para incluir leitura aos novos roles (Validador = mesma jurisdição que Gestor Provincial mas só leitura+aprovação; Auditor = leitura global de audit_logs)
- Nova função `can_validate(_user_id, _tenant_scope)` para gate de aprovações
- RLS de `audit_logs`: adicionar `AUDITOR` como leitor; manter imutabilidade (sem UPDATE/DELETE)
- Adicionar colunas `created_by uuid` e `updated_by uuid` em `professores`, `escolas`, `expedientes`, `infrastructure` (default `auth.uid()` em triggers)
- Trigger `set_created_by()` antes de INSERT
- Índice em `audit_logs(table_name, record_id, created_at DESC)`

**Frontend:**
- Atualizar `GestaoUtilizadores.tsx` com os 2 novos roles
- Badge visual diferenciado no Header
- Hook `useUserRole()` exposto globalmente

---

## FASE 2 — Workflow universal de aprovação (`pending_changes`)
**Nova tabela `pending_changes`:**
```
id, tenant_scope (province_id/municipality_id/school_id),
table_name, record_id (null = INSERT),
operation (INSERT|UPDATE|DELETE),
proposed_data jsonb, current_data jsonb (snapshot),
status (DRAFT|SUBMITTED|APPROVED|REJECTED|APPLIED),
submitted_by, submitted_at,
reviewed_by, reviewed_at, review_comment,
created_at, updated_at
```
- RLS: criador vê os seus; validador/admin vê os do seu tenant
- Função `apply_pending_change(pending_id)` SECURITY DEFINER — só executável por validador/admin, aplica o JSON ao registo oficial e marca `APPLIED`
- Trigger de audit em `pending_changes`

**Frontend:**
- Hook `usePendingChanges()` com realtime
- Componente `ApprovalQueue.tsx` (nova página `/aprovacoes`) — fila com diff visual lado-a-lado
- Refactor `ProfessorForm` e `EscolaForm`: em vez de gravar direto, criar `pending_change` se o user não for `ADMIN` ou `GESTOR_PROVINCIAL`
- Badge "Pendente" na linha do agente em edição
- Toast realtime quando uma submissão é aprovada/rejeitada

**Decisão importante:** ADMIN e GESTOR_PROVINCIAL continuam podendo editar direto (com audit). Apenas GESTOR_MUNICIPAL e DIRECTOR_ESCOLA passam pelo workflow. Isto evita gargalo.

---

## FASE 3 — Storage privado de documentos
**Migrações:**
- Bucket `agent-documents` privado
- Tabela `agent_documents`: `id, professor_id, doc_type (BI|CERTIFICADO|DIPLOMA|CONTRATO|DECLARACAO|OUTRO), file_path, file_size, mime_type, uploaded_by, uploaded_at`
- RLS storage: path = `{professor_id}/{filename}` — leitura só se `can_access_school` na escola do professor
- RLS tabela: idem
- Validação no upload: máx 5MB, mime types: pdf, jpg, png

**Frontend:**
- Componente `AgentDocumentsTab` no detalhe do professor
- Upload com progress + preview
- Signed URLs (1h) para download

---

## FASE 4 — Performance & UX
**DB:**
- Índices em FKs frequentes: `professores(escola_id, status)`, `escolas(municipality_id)`, `expedientes(escola_id, estado, data_submissao DESC)`, `attendance(student_id, date DESC)`

**Frontend:**
- Paginação server-side em `Professores.tsx` (range queries com `.range()`)
- `<Skeleton>` rows nas tabelas durante loading
- Lazy load de páginas pesadas via `React.lazy()` no `App.tsx` (Relatórios, AuditHistory, AIAssistant)
- Empty states consistentes (`empty-state.tsx` já existe)
- Memoização de filtros com `useMemo` onde for tabela grande

---

## Ordem de execução
1. Confirmar plano
2. Migração Fase 1 → testar login com novos roles
3. Migração + UI Fase 2 → testar fluxo de aprovação
4. Migração + UI Fase 3 → testar upload/download
5. Migração + refactor Fase 4 → medir ganho

## O que NÃO vou fazer (já está bom ou foi recusado)
- 2FA / HIBP (recusado nesta ronda)
- Adicionar `tenant_id` redundante (hierarquia atual já isola)
- Refazer audit_logs (já imutável e completo)
- Tocar em PWA / Command Palette / realtime de expedientes (já implementados)
- Reativar módulos académicos ocultos
