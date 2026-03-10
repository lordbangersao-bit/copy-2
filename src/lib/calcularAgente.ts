import { differenceInYears, parseISO } from "date-fns";

export function calcularIdade(dataNascimento: string | null): number | null {
  if (!dataNascimento) return null;
  try {
    return differenceInYears(new Date(), parseISO(dataNascimento));
  } catch {
    return null;
  }
}

export function calcularTempoServico(dataAdmissao: string | null): string | null {
  if (!dataAdmissao) return null;
  try {
    const anos = differenceInYears(new Date(), parseISO(dataAdmissao));
    return `${anos} ano${anos !== 1 ? "s" : ""}`;
  } catch {
    return null;
  }
}

export function calcularTempoServicoAnos(dataAdmissao: string | null): number {
  if (!dataAdmissao) return 0;
  try {
    return differenceInYears(new Date(), parseISO(dataAdmissao));
  } catch {
    return 0;
  }
}
