/**
 * Template oficial de impressão A4 — SIGE+
 * Governo Provincial do Cunene · Direcção Municipal da Educação
 *
 * Layout padrão institucional:
 *  - Cabeçalho: insígnia + títulos centrados
 *  - Bloco de contactos (canto sup. esquerdo)
 *  - Marca d'água diagonal "DMEN"
 *  - Rodapé em 3 colunas: Município · SIGE+ | Nº Doc / Data | Página x de y
 *  - Bloco de validação COMPACTO (apenas QR + Nº de Série)
 *
 * Criado por: Áureo Chissanhino Maria da Silva
 */

import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";

interface PrintTemplateOptions {
  title: string;
  content: string;
  userName?: string;
  verification?: VerificationData;
  municipality?: string;
  documentType?: string;
}

export interface VerificationData {
  documentCode: string;
  documentNumber: string;
  documentHash: string;
  signatureHash: string;
  municipality: string;
  issueDate: string;
  qrDataUrl: string;
  verifyUrl: string;
}

interface PrintOfficialDocumentOptions {
  title: string;
  content: string;
  userName?: string;
  documentType?: string;
  municipality?: string;
  recordId?: string;
}

// ============================================================
// PUBLIC API
// ============================================================

export async function printOfficialDocument(
  options: PrintOfficialDocumentOptions
): Promise<void> {
  const verification = await buildVerification(options);
  try {
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("issued_documents").insert({
      document_code: verification.documentCode,
      document_number: verification.documentNumber,
      document_type: options.documentType ?? "OFICIAL",
      title: options.title,
      document_hash: verification.documentHash,
      signature_hash: verification.signatureHash,
      municipality: verification.municipality,
      issued_by: u.user?.id ?? null,
      issued_by_name: options.userName ?? null,
      payload: { issue_date: verification.issueDate, record_id: options.recordId ?? null },
    });
  } catch (e) {
    console.warn("Falha ao registar documento para verificação pública:", e);
  }
  const html = getOfficialPrintHTML({
    title: options.title,
    content: options.content,
    userName: options.userName,
    municipality: options.municipality,
    documentType: options.documentType,
    verification,
  });
  openPrintWindow(html);
}

// ============================================================
// HASH + QR + CODE GENERATION
// ============================================================

async function sha256(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateDocumentCode(prefix = "SIGE"): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${year}-${rand}`;
}

function generateDocumentNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${ts}-${rand}`;
}

async function buildVerification(
  options: PrintOfficialDocumentOptions
): Promise<VerificationData> {
  const municipality = options.municipality ?? "Namacunde";
  const documentCode = generateDocumentCode();
  const documentNumber = generateDocumentNumber();
  const issueDate = new Date().toISOString();

  const documentHash = await sha256(
    [documentCode, documentNumber, options.title, options.content, options.recordId ?? "", issueDate].join("|")
  );
  const signatureHash = await sha256(
    `${documentHash}|JORGE-M-DOS-SANTOS-KENGELE-DAVID|${municipality}`
  );

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://sige.local";
  const verifyUrl = `${origin}/verify/${documentCode}`;

  // QR contém apenas a URL pública de verificação (leitura simples pela câmara)
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 160,
    color: { dark: "#0b1a3a", light: "#ffffff" },
  });

  return {
    documentCode,
    documentNumber,
    documentHash,
    signatureHash,
    municipality,
    issueDate,
    qrDataUrl,
    verifyUrl,
  };
}

// ============================================================
// HTML TEMPLATE
// ============================================================

export function getOfficialPrintHTML({
  title,
  content,
  userName,
  verification,
  municipality,
  documentType,
}: PrintTemplateOptions): string {
  const dataAtual = new Date().toLocaleDateString("pt-AO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const dataCurta = new Date().toLocaleDateString("pt-AO");

  const muni = municipality ?? verification?.municipality ?? "Namacunde";
  const docCode = verification?.documentCode ?? "—";
  const docName = documentType ?? title;

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)} — SIGE+</title>
  <style>
    @page {
      size: A4;
      margin: 28mm 18mm 26mm 18mm;

      @bottom-left {
        content: "${escapeHtml(muni)} ---- SIGE+";
        font-family: 'Times New Roman', serif;
        font-size: 9pt;
        color: #333;
      }
      @bottom-center {
        content: "Nº doc: ${escapeHtml(docCode)} — ${escapeHtml(docName)} · ${escapeHtml(dataCurta)}";
        font-family: 'Times New Roman', serif;
        font-size: 8.5pt;
        color: #333;
      }
      @bottom-right {
        content: "Página " counter(page) " de " counter(pages);
        font-family: 'Times New Roman', serif;
        font-size: 9pt;
        color: #333;
      }
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      font-family: 'Times New Roman', Times, serif;
      color: #111;
      font-size: 11.5pt;
      line-height: 1.55;
      background: #fff;
    }

    /* Watermark diagonal DMEN */
    .watermark {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-38deg);
      font-size: 150pt;
      font-weight: 700;
      color: rgba(0,0,0,0.06);
      letter-spacing: 12px;
      white-space: nowrap;
      z-index: -1;
      pointer-events: none;
      font-family: 'Times New Roman', serif;
    }

    /* Contact block (top-left, small) */
    .contact-block {
      position: fixed;
      top: 6mm;
      left: 8mm;
      font-size: 7.5pt;
      line-height: 1.35;
      color: #444;
      max-width: 55mm;
    }
    .contact-block a { color: #1a56a0; text-decoration: none; }

    /* Header centered */
    .official-header {
      text-align: center;
      padding-bottom: 8px;
      margin-bottom: 14px;
      page-break-after: avoid;
      break-after: avoid;
    }
    .official-header .brasao {
      width: 58px; height: auto; margin-bottom: 4px;
    }
    .official-header .gov-title,
    .official-header .admin-title,
    .official-header .direcao-title {
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      line-height: 1.35;
    }

    .doc-title {
      text-align: center;
      font-size: 13pt;
      font-weight: 700;
      margin: 14px 0 16px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      page-break-after: avoid;
      break-after: avoid;
    }

    .content { font-size: 11.5pt; line-height: 1.7; text-align: justify; }
    .content p { margin-bottom: 6px; orphans: 3; widows: 3; }
    .content h2 {
      font-size: 12pt; margin: 14px 0 8px; font-weight: 700;
      page-break-after: avoid; break-after: avoid;
    }
    .content h3 {
      font-size: 11pt; margin: 10px 0 6px; font-weight: 700;
      page-break-after: avoid; break-after: avoid;
    }
    .content ul, .content ol { margin-left: 18px; margin-bottom: 8px; }

    .content table {
      width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9.5pt;
    }
    .content tr { page-break-inside: avoid; break-inside: avoid; }
    .content thead { display: table-header-group; }
    .content th, .content td {
      border: 1px solid #333; padding: 5px 8px; text-align: left; vertical-align: top;
    }
    .content th {
      background: #1a365d; color: #fff; font-weight: 600; font-size: 9.5pt;
    }
    .content tr:nth-child(even) td { background: #f5f5f5; }

    .id-block, [data-pdf-block="id"], [data-pdf-block="bi"] {
      page-break-inside: avoid; break-inside: avoid;
    }

    .stats-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
      margin: 10px 0; break-inside: avoid;
    }
    .stat-box { border: 1px solid #333; padding: 8px; text-align: center; }
    .stat-box .value { font-size: 18pt; font-weight: 700; color: #1a365d; }
    .stat-box .label { font-size: 8.5pt; color: #555; margin-top: 2px; }

    /* Signature */
    .signature-block {
      margin-top: 40px;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .signature-block .location-date {
      text-align: left; font-style: italic;
      margin-bottom: 36px; font-size: 10.5pt;
    }
    .signature-block .director-role {
      font-weight: 700; font-style: italic; font-size: 10.5pt; margin-bottom: 4px;
    }
    .signature-block .director-name {
      font-weight: 700; font-size: 11pt; text-transform: uppercase; letter-spacing: 0.4px;
    }
    .user-info { text-align: left; margin-top: 18px; font-size: 9pt; color: #666; }

    /* Compact validation block (QR + Serial only) */
    .validation-strip {
      margin-top: 24px;
      padding-top: 8px;
      border-top: 1px solid #999;
      display: flex;
      align-items: center;
      gap: 12px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .validation-strip .qr {
      width: 78px; height: 78px; flex: 0 0 78px;
    }
    .validation-strip .qr img { width: 100%; height: 100%; display: block; }
    .validation-strip .meta {
      font-size: 8.5pt; line-height: 1.45; color: #333;
    }
    .validation-strip .meta .serial {
      font-family: 'Courier New', monospace;
      font-size: 10pt; font-weight: 700; color: #0b1a3a; letter-spacing: 0.5px;
    }
    .validation-strip .meta .label {
      text-transform: uppercase; font-size: 7.5pt; color: #666; letter-spacing: 0.6px;
    }

    /* Rodapé institucional (aparece no fim da última página) */
    .institutional-footer {
      margin-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 7.5pt;
      color: #444;
      page-break-inside: avoid;
    }
    .institutional-footer .addr { line-height: 1.4; max-width: 65%; }
    .institutional-footer .addr a { color: #1a56a0; text-decoration: none; }
    .institutional-footer .gov-logo { height: 26px; }

    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="watermark">DMEN</div>

  <aside class="contact-block">
    Governo Provincial do Cunene<br/>
    Direcção Municipal da Educação<br/>
    Tel: 924 688 671<br/>
    Email: <a href="mailto:rmectnamacunde@gmail.com">rmectnamacunde@gmail.com</a><br/>
    ANGOLA
  </aside>

  <header class="official-header">
    <img src="/images/brasao-angola.png" class="brasao" alt="" onerror="this.style.display='none'" />
    <div class="gov-title">GOVERNO PROVINCIAL DO CUNENE</div>
    <div class="admin-title">ADMINISTRAÇÃO MUNICIPAL DE ${escapeHtml(muni).toUpperCase()}</div>
    <div class="direcao-title">DIRECÇÃO DA EDUCAÇÃO</div>
  </header>

  <div class="doc-title">${escapeHtml(title)}</div>

  <main class="content">
    ${content}
  </main>

  <section class="signature-block">
    <div class="location-date">
      Direcção Municipal da Educação em ${escapeHtml(muni)}, ${dataAtual}.
    </div>
    <div class="director-role">O Director Municipal</div>
    <div class="director-name">JORGE MANUEL DOS SANTOS KENGELE DAVID</div>
    ${userName ? `<div class="user-info">Emitido por: ${escapeHtml(userName)}</div>` : ""}
  </section>

  ${verification ? renderValidationStrip(verification) : ""}

  <footer class="institutional-footer">
    <div class="addr">
      Governo Provincial do Cunene · Direcção Municipal da Educação<br/>
      Tel: 924 688 671 · <a href="mailto:rmectnamacunde@gmail.com">rmectnamacunde@gmail.com</a> · ANGOLA
    </div>
    <img src="/images/governo-angola-logo.png" class="gov-logo" alt="" onerror="this.style.display='none'" />
  </footer>
</body>
</html>`;
}

// ============================================================
// COMPACT VALIDATION STRIP (QR + Serial only)
// ============================================================

function renderValidationStrip(v: VerificationData): string {
  return `
  <section class="validation-strip" aria-label="Validação">
    <div class="qr">
      <img src="${v.qrDataUrl}" alt="QR de validação" />
    </div>
    <div class="meta">
      <div class="label">Nº de Série (Validação)</div>
      <div class="serial">${escapeHtml(v.documentCode)}</div>
      <div style="margin-top:4px;">
        Verifique em: <span style="font-family:'Courier New',monospace;">${escapeHtml(v.verifyUrl)}</span>
      </div>
    </div>
  </section>`;
}

// ============================================================
// UTILITIES
// ============================================================

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function openPrintWindow(html: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  const trigger = () => {
    try { printWindow.print(); } catch { /* noop */ }
  };
  setTimeout(trigger, 700);
}
