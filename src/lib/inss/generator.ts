import { platform } from "@/lib/platform";
import ExcelJS from "exceljs";
import { supabase } from "@/integrations/supabase/client";

export interface InssEmployeeRow {
  niss: string;
  nome: string;
  vencimentoBase: number;
  additional: number;
  totalAbonos: number;
  missingNiss?: boolean;
}

export interface InssExportInput {
  tipo: "Normal" | "Complementar";
  referenceMonth: string; // e.g. "06/2026"
  employerName: string;
  employerNiss: string;
  employerNif: string;
  rows: InssEmployeeRow[];
}

/** Fetches the official template stored in the inss-templates bucket. */
export async function fetchDefaultTemplate(): Promise<ArrayBuffer> {
  const { data, error } = await supabase.storage
    .from("inss-templates")
    .download("official/inss-default.xlsx");
  if (error || !data) throw new Error("Não foi possível carregar o template INSS oficial.");
  return await data.arrayBuffer();
}

function refMonthToDate(ref: string): Date {
  // "06/2026" -> Date(2026,5,1)
  const m = /^(\d{1,2})[\/\-](\d{4})$/.exec(ref.trim());
  if (m) return new Date(parseInt(m[2]), parseInt(m[1]) - 1, 1);
  return new Date();
}

export async function generateInssWorkbook(input: InssExportInput): Promise<ArrayBuffer> {
  const templateBuf = await fetchDefaultTemplate();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(templateBuf);

  const ws = wb.getWorksheet("Folha") ?? wb.worksheets[0];
  if (!ws) throw new Error("Template inválido: sem folha 'Folha'.");

  // Header cells (preserve template formatting)
  ws.getCell("B1").value = `Folha de Remuneração ${input.tipo}`;
  ws.getCell("B2").value = refMonthToDate(input.referenceMonth);
  ws.getCell("B2").numFmt = "mm/yyyy";
  ws.getCell("B3").value = input.tipo;
  ws.getCell("B5").value = input.employerName;
  ws.getCell("B6").value = input.employerNiss;
  ws.getCell("B7").value = input.employerNif;

  // Clear existing data rows (from row 11 to end)
  const lastRow = ws.rowCount;
  for (let r = lastRow; r >= 11; r--) {
    ws.spliceRows(r, 1);
  }

  // Insert employees starting at row 11
  input.rows.forEach((emp, i) => {
    const row = ws.getRow(11 + i);
    row.getCell(1).value = emp.niss || "";
    row.getCell(2).value = emp.nome;
    row.getCell(3).value = emp.vencimentoBase;
    row.getCell(4).value = emp.additional;
    row.getCell(5).value = emp.totalAbonos;
    for (let c = 3; c <= 5; c++) {
      row.getCell(c).numFmt = "#,##0.00";
    }
    if (emp.missingNiss) {
      for (let c = 1; c <= 5; c++) {
        row.getCell(c).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFF3CD" },
        };
      }
      row.getCell(1).value = "";
    }
    row.commit();
  });

  const out = await wb.xlsx.writeBuffer();
  return out as ArrayBuffer;
}

export function generateCsv(input: InssExportInput): string {
  const header = ["Inscricao INSS", "Nome", "Salario Base", "Remuneracoes Adicionais", "Total"];
  const lines = [header.join(";")];
  for (const r of input.rows) {
    lines.push([
      r.niss ?? "",
      `"${r.nome.replace(/"/g, '""')}"`,
      r.vencimentoBase.toFixed(2),
      r.additional.toFixed(2),
      r.totalAbonos.toFixed(2),
    ].join(";"));
  }
  return "\uFEFF" + lines.join("\n");
}

export async function computeChecksum(buffer: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function downloadBlob(data: BlobPart, filename: string, mime: string) {
  void platform.saveFile({ data, filename, mime });
}
