import ExcelJS from "exceljs";

export interface RawPayrollRow {
  rowIndex: number;
  numeroContribuinte: string;
  nome: string;
  vencimentoBase: number;
  totalAbonos: number;
  additional: number;
}

export interface ParseResult {
  rows: RawPayrollRow[];
  unidadeOrganica: string | null;
  ignoredRows: number;
  invalidRows: Array<{ rowIndex: number; reason: string }>;
  duplicates: string[];
  totals: { base: number; adicionais: number; bruto: number };
}

/** Converts Portuguese formatted numbers (1.234,56 or "0,00") into a JS number. */
export function parsePtNumber(value: unknown): number {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return isFinite(value) ? value : 0;
  const s = String(value).trim();
  if (!s) return 0;
  // Remove currency and spaces
  const cleaned = s.replace(/\s|Kz|AOA|R\$|\u00A0/gi, "");
  // Detect Portuguese: last separator is "," → decimal
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized: string;
  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    // English format — remove thousand commas
    normalized = cleaned.replace(/,/g, "");
  } else {
    normalized = cleaned.replace(",", ".");
  }
  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : n;
}

const COL_NUMERO = 1;
const COL_AGENTE = 2;
const COL_VENC_BASE = 8;
const COL_TOTAL_ABONOS = 18;

export async function parsePayrollFile(file: File | ArrayBuffer): Promise<ParseResult> {
  const buffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  // Try "Ficheiro" first; fall back to first sheet with matching header
  let ws = wb.getWorksheet("Ficheiro");
  if (!ws) ws = wb.worksheets[0];
  if (!ws) throw new Error("Nenhuma folha encontrada no ficheiro.");

  const rows: RawPayrollRow[] = [];
  const invalid: Array<{ rowIndex: number; reason: string }> = [];
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  let unidadeOrganica: string | null = null;
  let ignoredRows = 0;
  let base = 0, adicionais = 0, bruto = 0;

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const a = row.getCell(COL_NUMERO).value;
    const b = row.getCell(COL_AGENTE).value;
    const aStr = a == null ? "" : String((a as any)?.text ?? a).trim();
    const bStr = b == null ? "" : String((b as any)?.text ?? b).trim();

    // Title row
    if (rowNumber === 1) { ignoredRows++; return; }
    // Header row
    if (/numero contribuinte/i.test(aStr)) { ignoredRows++; return; }
    // Unidade Orgânica subtotal
    if (/unidade\s+org/i.test(aStr) || /^\[/.test(bStr)) {
      if (!unidadeOrganica && bStr) unidadeOrganica = bStr.replace(/^\[.*?\]\s*/, "").trim();
      ignoredRows++;
      return;
    }
    // Totals
    if (/total\s+geral/i.test(aStr) || /total/i.test(aStr) && !bStr) { ignoredRows++; return; }
    // Empty
    if (!aStr && !bStr) { ignoredRows++; return; }
    // No numero contribuinte
    if (!aStr) {
      invalid.push({ rowIndex: rowNumber, reason: "Sem Número de Contribuinte" });
      return;
    }
    if (!bStr) {
      invalid.push({ rowIndex: rowNumber, reason: "Sem nome do agente" });
      return;
    }

    const vBase = parsePtNumber(row.getCell(COL_VENC_BASE).value);
    const vTotal = parsePtNumber(row.getCell(COL_TOTAL_ABONOS).value);
    const additional = Math.max(0, +(vTotal - vBase).toFixed(2));

    if (vBase < 0 || vTotal < 0) {
      invalid.push({ rowIndex: rowNumber, reason: "Valor negativo detectado" });
      return;
    }

    if (seen.has(aStr)) duplicates.add(aStr);
    seen.add(aStr);

    rows.push({
      rowIndex: rowNumber,
      numeroContribuinte: aStr,
      nome: bStr,
      vencimentoBase: +vBase.toFixed(2),
      totalAbonos: +vTotal.toFixed(2),
      additional,
    });

    base += vBase;
    adicionais += additional;
    bruto += vTotal;
  });

  return {
    rows,
    unidadeOrganica,
    ignoredRows,
    invalidRows: invalid,
    duplicates: Array.from(duplicates),
    totals: {
      base: +base.toFixed(2),
      adicionais: +adicionais.toFixed(2),
      bruto: +bruto.toFixed(2),
    },
  };
}
