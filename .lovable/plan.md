# Plano: Evolução do SIGE para nível ministerial

Sistema actual mantém-se. Acrescenta-se uma camada hierárquica de UOs, scoping de dashboards, workflow de transferências, snapshots oficiais e detecção de défice. Nada de redesign — apenas lógica, segurança e analítica.

## 1. Hierarquia de UOs (sem quebrar tenancy actual)

O modelo actual usa `provinces → municipalities → escolas`. Em vez de criar uma nova tabela paralela, expomos uma **vista unificada de UO** e funções recursivas que os módulos novos vão consumir. Os módulos existentes continuam a usar `province_id / municipality_id / school_id`.

- `VIEW public.organizational_units` com colunas `(id, name, type, parent_id)` unindo as três tabelas (`PROVINCIAL | MUNICIPAL | SCHOOL`).
- Função `public.get_user_uo(_user_id)` → devolve a UO do utilizador a partir de `user_roles` (school > municipality > province).
- Função recursiva `public.get_accessible_uos(_uo_id uuid)` → devolve `setof uuid` com a própria UO e todos os descendentes (recursive CTE).
- Função `public.get_accessible_school_ids(_user_id)` → conjunto de `escolas.id` acessíveis (usada por dashboard, snapshots e défice). Reaproveita `can_access_school` mas em forma de set para queries agregadas eficientes.

Não removemos `can_access_school` nem as RLS existentes — já estão correctas e cobrem o isolamento.

## 2. Dashboard com scope por UO (correcção do bug)

Os hooks `useProfessores`, `useEscolas`, `useStudents` já são filtrados via RLS, mas o **dashboard e Relatórios** mostram totais sem distinção visual de scope. Vamos:

- Criar `useDashboardScope()` que devolve `{ scopeLabel, scopeType, accessibleSchoolIds }` com base no role+UO do utilizador.
- `src/pages/Index.tsx` (dashboard) e `src/pages/Relatorios.tsx`: mostrar badge de scope ("Província X" / "Município Y" / "Escola Z") e usar `accessibleSchoolIds` para reforçar agregações no cliente (defesa em profundidade — RLS já filtra os dados, mas garantimos que charts/exports respeitam o subset).
- KPIs adicionais: "Escolas no meu scope", "Agentes no meu scope".

## 3. Workflow de transferências de professores

Nova tabela `public.transfer_requests`:

```
id uuid pk, professor_id uuid, from_school_id uuid, to_school_id uuid,
reason text, status text check in ('REQUESTED','UNDER_REVIEW','APPROVED','EXECUTED','REJECTED'),
requested_by uuid, requested_at timestamptz default now(),
reviewed_by uuid, reviewed_at timestamptz, review_comment text,
executed_by uuid, executed_at timestamptz,
created_at, updated_at
```

Tabela `public.transfer_history`:
```
id, professor_id, from_school_id, to_school_id, transfer_request_id,
executed_by, executed_at, snapshot jsonb
```

Regras RLS:
- INSERT: `DIRECTOR_ESCOLA` e `GESTOR_MUNICIPAL` da escola origem.
- UPDATE para `UNDER_REVIEW|APPROVED|REJECTED`: `GESTOR_MUNICIPAL` (se ambas escolas no município) ou `GESTOR_PROVINCIAL` (se na província) ou `ADMIN`.
- SELECT: quem tem acesso a origem **ou** destino.

Função `public.execute_transfer(_request_id uuid)` SECURITY DEFINER:
- Valida status = `APPROVED` e permissão de quem executa.
- Insere linha em `transfer_history` com snapshot do professor.
- Faz `UPDATE professores SET escola_id = to_school_id`.
- Marca request como `EXECUTED`.

Página `src/pages/Transferencias.tsx` + hook `useTransferRequests`:
- Director de escola: criar e listar pedidos da sua escola.
- Gestor municipal/provincial: revisar, aprovar/rejeitar, executar.
- Timeline visual de estados + diff origem→destino.

Botão "Transferir" no modal de detalhes do professor em `Professores.tsx`.

## 4. Sistema oficial de relatórios (snapshots)

Tabela `public.statistics_snapshots`:
```
id, scope_type text ('PROVINCE'|'MUNICIPALITY'|'SCHOOL'),
scope_id uuid, period_type text ('DAILY'|'MONTHLY'|'YEARLY'),
period_key text (ex: '2026-05', '2026'),
total_teachers int, teachers_male int, teachers_female int,
teachers_by_category jsonb, total_schools int, total_students int,
total_classes int, payload jsonb,
generated_by uuid, generated_at timestamptz default now(),
locked bool default true
```

Snapshots são **imutáveis** (sem UPDATE/DELETE em RLS para não-admin).

Função `public.generate_snapshot(_scope_type, _scope_id, _period_type, _period_key)` SECURITY DEFINER:
- Calcula totais a partir de `professores`/`escolas`/`students` respeitando o scope.
- Insere em `statistics_snapshots`.

Página `src/pages/RelatoriosOficiais.tsx`:
- Gerar snapshot (gestor provincial/municipal).
- Listar snapshots históricos com filtros por período/scope.
- Exportar PDF (reaproveita `PrintableReport`).

## 5. Detecção de défice docente

Tabela `public.teacher_requirements`:
```
id, school_id uuid unique, required_teachers int not null,
notes text, updated_by, updated_at
```

Vista `public.deficit_by_municipality`:
```
SELECT m.id, m.name, m.province_id,
       sum(coalesce(tr.required_teachers,0)) as required,
       (SELECT count(*) FROM professores p
          JOIN escolas e ON e.id = p.escola_id
          WHERE e.municipality_id = m.id AND p.status='ativo') as current_teachers,
       (required - current_teachers) as deficit,
       CASE
         WHEN deficit <= 0 THEN 'SURPLUS'
         WHEN deficit::float / nullif(required,0) < 0.1 THEN 'LOW'
         WHEN deficit::float / nullif(required,0) < 0.25 THEN 'MODERATE'
         WHEN deficit::float / nullif(required,0) < 0.5 THEN 'CRITICAL'
         ELSE 'EMERGENCY'
       END as severity
FROM municipalities m
LEFT JOIN escolas e ON e.municipality_id = m.id
LEFT JOIN teacher_requirements tr ON tr.school_id = e.id
GROUP BY m.id;
```

Página `src/pages/DeficitDocente.tsx`:
- Ranking de municípios por défice (apenas dos acessíveis via RLS).
- Cards com severidade colorida, alertas para CRITICAL/EMERGENCY.
- Form para definir `required_teachers` por escola (gestor municipal+).

## 6. Segurança & isolamento (revisão)

- Verificar que todas as novas tabelas têm `GRANT` + RLS.
- `transfer_requests`, `transfer_history`, `statistics_snapshots`, `teacher_requirements` → policies baseadas em `can_access_school` ou `has_role`.
- Auditoria já cobre via `audit_trigger_func` — adicionar triggers às novas tabelas.

## 7. Rotas e sidebar

`App.tsx`: lazy routes `/transferencias`, `/relatorios-oficiais`, `/deficit`.
`AppSidebar.tsx`: 3 novos itens visíveis conforme role.

---

### Detalhes técnicos

**Migrações (3):**
1. View `organizational_units` + funções `get_user_uo`, `get_accessible_uos`, `get_accessible_school_ids`.
2. `transfer_requests` + `transfer_history` + RLS + `execute_transfer`.
3. `statistics_snapshots` + `teacher_requirements` + view `deficit_by_municipality` + `generate_snapshot` + RLS + GRANTs + audit triggers.

**Ficheiros novos:**
- `src/hooks/useDashboardScope.ts`
- `src/hooks/useTransferRequests.ts`
- `src/hooks/useStatisticsSnapshots.ts`
- `src/hooks/useDeficit.ts`
- `src/pages/Transferencias.tsx`
- `src/pages/RelatoriosOficiais.tsx`
- `src/pages/DeficitDocente.tsx`

**Ficheiros editados (mínimos):**
- `src/pages/Index.tsx` (badge de scope + KPIs do scope)
- `src/pages/Relatorios.tsx` (badge de scope, link p/ snapshots)
- `src/pages/Professores.tsx` (botão Transferir no modal)
- `src/App.tsx` (3 lazy routes)
- `src/components/layout/AppSidebar.tsx` (3 itens)

### Fora do escopo (já está bom)
- RLS de `professores/escolas/expedientes` — já implementam isolamento hierárquico via `can_access_school`.
- `pending_changes` workflow — já cobre alterações controladas.
- Audit logs — já completos.
- `agent_documents` storage — já privado e scoped.
