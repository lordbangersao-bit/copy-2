import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { InssExportInput, InssEmployeeRow } from "./generator";

export interface SummaryStats {
  totalRead: number;
  validEmployees: number;
  missingNiss: number;
  duplicates: number;
  ignoredRows: number;
  invalidRows: number;
  totalBase: number;
  totalAdicionais: number;
  totalBruto: number;
}

export function generateSummaryPdf(input: InssExportInput, stats: SummaryStats): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("REPÚBLICA DE ANGOLA", 105, 15, { align: "center" });
  doc.setFontSize(11);
  doc.text("Instituto Nacional de Segurança Social", 105, 21, { align: "center" });
  doc.setFontSize(13);
  doc.text(`Folha de Remuneração ${input.tipo} — Sumário`, 105, 30, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const info = [
    ["Contribuinte", input.employerName],
    ["NISS", input.employerNiss],
    ["NIF", input.employerNif],
    ["Mês de Referência", input.referenceMonth],
    ["Data de Emissão", new Date().toLocaleString("pt-PT")],
  ];
  autoTable(doc, {
    startY: 36,
    head: [["Campo", "Valor"]],
    body: info,
    theme: "grid",
    headStyles: { fillColor: [30, 58, 138] },
    styles: { fontSize: 9 },
  });

  const stat = [
    ["Total de Agentes Lidos", stats.totalRead.toString()],
    ["Agentes Válidos", stats.validEmployees.toString()],
    ["Sem Inscrição INSS", stats.missingNiss.toString()],
    ["Duplicados", stats.duplicates.toString()],
    ["Linhas Ignoradas", stats.ignoredRows.toString()],
    ["Linhas Inválidas", stats.invalidRows.toString()],
    ["Total Salário Base", formatKz(stats.totalBase)],
    ["Total Remunerações Adicionais", formatKz(stats.totalAdicionais)],
    ["Total Bruto", formatKz(stats.totalBruto)],
  ];
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [["Indicador", "Valor"]],
    body: stat,
    theme: "striped",
    headStyles: { fillColor: [22, 101, 52] },
    styles: { fontSize: 9 },
  });

  const missing = input.rows.filter(r => r.missingNiss);
  if (missing.length > 0) {
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Agentes sem Inscrição INSS", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [["#", "Nome", "Salário Base", "Total"]],
      body: missing.map((r, i) => [
        (i + 1).toString(),
        r.nome,
        formatKz(r.vencimentoBase),
        formatKz(r.totalAbonos),
      ]),
      theme: "grid",
      headStyles: { fillColor: [153, 27, 27] },
      styles: { fontSize: 8 },
    });
  }

  return doc.output("blob");
}

function formatKz(n: number): string {
  return new Intl.NumberFormat("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}
