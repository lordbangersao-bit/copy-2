

## Plano: Remover/Adicionar Municípios + Pesquisa por Nº Agente/BI + Dashboard Isolado por Município

### Resumo

Três melhorias principais:
1. Adicionar botão de remover município na página de Municípios (com confirmação)
2. Adicionar pesquisa global por nº de agente ou nº de BI (campo `cpf`) nas páginas relevantes
3. Dashboard isolado por município para gestores municipais, e dashboard geral para o gestor provincial

---

### 1. Remover Município

**Hook** (`useMunicipalities.ts`):
- Adicionar `useDeleteMunicipality` mutation que chama `supabase.from("municipalities").delete().eq("id", id)`
- Invalidar queries on success

**Página** (`Municipios.tsx`):
- Adicionar botão `Trash2` em cada card de município (visível apenas para admin/gestor provincial)
- Usar `ConfirmDialog` existente para pedir confirmação antes de eliminar
- Validar se município tem escolas vinculadas e alertar o utilizador

---

### 2. Pesquisa por Nº de Agente ou Nº de BI

**Página de Professores** (`Professores.tsx`):
- Expandir o campo de pesquisa existente para também filtrar por `numero_agente` e `cpf` (BI)
- Placeholder: "Pesquisar por nome, nº agente ou nº BI..."

**Página de Municípios** (`Municipios.tsx`):
- Adicionar segundo campo de pesquisa ou expandir o existente para pesquisar agentes dentro dos municípios expandidos por `numero_agente` ou `cpf`

---

### 3. Dashboard Isolado por Município

**Dashboard principal** (`Index.tsx`):
- Para `GESTOR_MUNICIPAL`: os dados já são filtrados via RLS, mas melhorar o cabeçalho para mostrar o nome do município
- Buscar o nome do município do utilizador via `municipalities` query usando `roleInfo.municipality_id`

**Para `GESTOR_PROVINCIAL` / `ADMIN`**:
- Adicionar secção "Dados por Município" no dashboard com cards ou tabela que mostra, para cada município: nº de escolas, nº de agentes, agentes activos/afastados
- Cada card clicável navega para uma vista filtrada

**Novo componente ou secção no Index.tsx**:
- Grid de cards municipais com métricas resumidas (escolas, agentes, docentes)
- Visível apenas para admin e gestor provincial

---

### Ficheiros a alterar

| Ficheiro | Alteração |
|---|---|
| `src/hooks/useMunicipalities.ts` | Adicionar `useDeleteMunicipality` |
| `src/pages/Municipios.tsx` | Botão remover com confirmação + pesquisa por nº agente/BI |
| `src/pages/Professores.tsx` | Expandir filtro de pesquisa para incluir `numero_agente` e `cpf` |
| `src/pages/Index.tsx` | Secção de dashboard por município + nome do município no header municipal |

### Sem alterações de base de dados

As RLS policies de DELETE em `municipalities` já permitem admin e gestor provincial. Não é necessária migração.

