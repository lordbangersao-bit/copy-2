/**
 * Sistema de classificação de funcionários
 * 
 * Classes principais:
 * 1. PESSOAL DOCENTE - Professores e auxiliares de ensino
 * 2. PESSOAL DE DIRECÇÃO E CHEFIA - Directores, subdirectores, coordenadores
 * 3. PESSOAL ADMINISTRATIVO - Chefes de secretaria, de secção, administrativos
 * 4. PESSOAL OPERÁRIO E DE APOIO - Auxiliares de limpeza, operários qualificados
 */

export type ClasseFuncionario =
  | "docente"
  | "direccao_chefia"
  | "administrativo"
  | "operario_apoio";

export interface ClassificacaoInfo {
  classe: ClasseFuncionario;
  label: string;
  subclasse: string;
  cor: string; // semantic token name
}

const CLASSIFICACOES: Record<ClasseFuncionario, { label: string; cor: string }> = {
  docente: { label: "Pessoal Docente", cor: "primary" },
  direccao_chefia: { label: "Direcção e Chefia", cor: "secondary" },
  administrativo: { label: "Pessoal Administrativo", cor: "info" },
  operario_apoio: { label: "Pessoal Operário e de Apoio", cor: "warning" },
};

// Patterns to match against categoria or funcao (case-insensitive)
const PATTERNS: { classe: ClasseFuncionario; subclasse: string; patterns: RegExp[] }[] = [
  // PESSOAL OPERÁRIO E DE APOIO
  {
    classe: "operario_apoio",
    subclasse: "Auxiliar de Limpeza",
    patterns: [/auxiliar\s*(de)?\s*limpeza/i],
  },
  {
    classe: "operario_apoio",
    subclasse: "Operário Qualificado",
    patterns: [/oper[aá]rio\s*qualificado/i],
  },
  // PESSOAL ADMINISTRATIVO
  {
    classe: "administrativo",
    subclasse: "Chefe de Secretaria",
    patterns: [/chefe\s*(de)?\s*secretaria/i],
  },
  {
    classe: "administrativo",
    subclasse: "Chefe de Secção Municipal",
    patterns: [/chefe\s*(de)?\s*sec[cç][aã]o/i],
  },
  {
    classe: "administrativo",
    subclasse: "Administrativo",
    patterns: [/^administrativo$/i],
  },
  // PESSOAL DE DIRECÇÃO E CHEFIA
  {
    classe: "direccao_chefia",
    subclasse: "Director",
    patterns: [/^director\b/i, /director\s*(d[ao]|do)\s*(escola|col[eé]gio)/i],
  },
  {
    classe: "direccao_chefia",
    subclasse: "Subdirector",
    patterns: [/subdirector/i, /sub-director/i],
  },
  {
    classe: "direccao_chefia",
    subclasse: "Coordenador Pedagógico",
    patterns: [/coordenador/i, /cord\./i],
  },
  // PESSOAL DOCENTE (catch-all for prof.)
  {
    classe: "docente",
    subclasse: "Professor",
    patterns: [/prof/i, /professor/i],
  },
];

export function classificarFuncionario(
  categoria?: string | null,
  funcao?: string | null
): ClassificacaoInfo {
  const textos = [funcao, categoria].filter(Boolean) as string[];

  for (const texto of textos) {
    for (const item of PATTERNS) {
      if (item.patterns.some((p) => p.test(texto))) {
        return {
          classe: item.classe,
          label: CLASSIFICACOES[item.classe].label,
          subclasse: item.subclasse,
          cor: CLASSIFICACOES[item.classe].cor,
        };
      }
    }
  }

  // Default: docente (most agents are teachers)
  return {
    classe: "docente",
    label: CLASSIFICACOES.docente.label,
    subclasse: "Não classificado",
    cor: CLASSIFICACOES.docente.cor,
  };
}

export function getClasseInfo(classe: ClasseFuncionario) {
  return CLASSIFICACOES[classe];
}

export function getAllClasses() {
  return Object.entries(CLASSIFICACOES).map(([key, val]) => ({
    classe: key as ClasseFuncionario,
    ...val,
  }));
}
