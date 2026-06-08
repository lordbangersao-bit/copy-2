/**
 * Template oficial de impressão A4 — Governo Provincial do Cunene
 * Direcção Municipal da Educação em Namacunde
 *
 * Engine de renderização governamental:
 *  - Margens A4 fixas (Top 30mm / Bottom 40mm / Left/Right 20mm)
 *  - Footer institucional sem sobreposição
 *  - Numeração automática de páginas (Página X de Y)
 *  - Quebra de página inteligente (assinatura, tabelas e BIs nunca cortados)
 *  - Página final OBRIGATÓRIA de verificação (código, hash SHA-256, QR)
 *
 * Criado por: Áureo Chissanhino Maria da Silva
 */

import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";

interface PrintTemplateOptions {
  title: string;
  content: string;
  userName?: string;
  /** Optional metadata for the mandatory verification page */
  verification?: VerificationData;
  /** Municipality shown in footer/verification (default: Namacunde) */
  municipality?: string;
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

/**
 * Generate and print an official government document.
 * Handles hashing, QR generation, pagination and the final verification page.
 */
export async function printOfficialDocument(
  options: PrintOfficialDocumentOptions
): Promise<void> {
  const verification = await buildVerification(options);
  // Register issued document for public verification (non-blocking on error)
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
      professor_id: options.recordId ?? null,
      payload: { issue_date: verification.issueDate },
    });
  } catch (e) {
    console.warn("Falha ao registar documento para verificação pública:", e);
  }
  const html = getOfficialPrintHTML({
    title: options.title,
    content: options.content,
    userName: options.userName,
    municipality: options.municipality,
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
    [
      documentCode,
      documentNumber,
      options.title,
      options.content,
      options.recordId ?? "",
      issueDate,
    ].join("|")
  );

  const signatureHash = await sha256(
    `${documentHash}|JORGE-M-DOS-SANTOS-KENGELE-DAVID|${municipality}`
  );

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://sige.local";
  const verifyUrl = `${origin}/verify/${documentCode}`;

  const qrPayload = JSON.stringify({
    code: documentCode,
    hash: documentHash,
    url: verifyUrl,
    municipality,
  });

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 220,
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
}: PrintTemplateOptions): string {
  const dataAtual = new Date().toLocaleDateString("pt-AO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const muni = municipality ?? verification?.municipality ?? "Namacunde";
  const verificationBlock = verification ? renderVerificationPage(verification) : "";

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)} — DMEN Gestor</title>
  <style>
    /* ==========================================================
       A4 PAGE RULES — Government Grade
       Top: 30mm · Bottom: 40mm · Left/Right: 20mm
       ========================================================== */
    @page {
      size: A4;
      margin: 30mm 20mm 40mm 20mm;

      @bottom-right {
        content: "Página " counter(page) " de " counter(pages);
        font-family: 'Times New Roman', serif;
        font-size: 9pt;
        color: #555;
      }
      @bottom-left {
        content: "DMEN — ${escapeHtml(muni)}";
        font-family: 'Times New Roman', serif;
        font-size: 9pt;
        color: #555;
      }
      @bottom-center {
        content: "${verification ? `Doc: ${escapeHtml(verification.documentCode)}` : ""}";
        font-family: 'Times New Roman', serif;
        font-size: 9pt;
        color: #555;
      }
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      font-family: 'Times New Roman', Times, serif;
      color: #1a1a1a;
      font-size: 12pt;
      line-height: 1.6;
      background: #fff;
    }

    /* ============ FIXED FOOTER (repeats every page, in @page margin) ============ */
    .running-footer {
      position: running(footer);
      font-size: 9pt;
      color: #555;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 4px;
      border-top: 1px solid #ccc;
    }

    /* ============ WATERMARK ============ */
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 120pt;
      font-weight: 700;
      color: rgba(0,0,0,0.04);
      letter-spacing: 20px;
      white-space: nowrap;
      z-index: -1;
      pointer-events: none;
    }

    /* ============ HEADER ============ */
    .official-header {
      text-align: center;
      padding-bottom: 16px;
      margin-bottom: 20px;
      border-bottom: 2px solid #333;
      page-break-after: avoid;
      break-after: avoid;
    }
    .official-header .brasao { width: 70px; height: auto; margin-bottom: 6px; }
    .official-header .gov-title,
    .official-header .admin-title {
      font-size: 12pt; text-transform: uppercase; letter-spacing: 1px;
    }
    .official-header .direcao-title {
      font-size: 14pt; font-weight: 700; text-decoration: underline;
      letter-spacing: 1px; margin-top: 6px;
    }

    /* ============ DOCUMENT TITLE ============ */
    .doc-title {
      text-align: center;
      font-size: 14pt;
      font-weight: 700;
      margin: 16px 0 22px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      page-break-after: avoid;
      break-after: avoid;
    }

    /* ============ CONTENT ============ */
    .content { font-size: 12pt; line-height: 1.8; text-align: justify; }
    .content p { margin-bottom: 8px; orphans: 3; widows: 3; }
    .content h2 {
      font-size: 13pt; margin: 18px 0 10px; font-weight: 700;
      page-break-after: avoid; break-after: avoid;
    }
    .content h3 {
      font-size: 12pt; margin: 14px 0 8px; font-weight: 700;
      page-break-after: avoid; break-after: avoid;
    }
    .content ul, .content ol { margin-left: 20px; margin-bottom: 10px; }

    /* Tables NEVER split a row */
    .content table {
      width: 100%; border-collapse: collapse; margin: 15px 0;
      font-size: 10pt;
    }
    .content table, .content tbody { break-inside: auto; }
    .content tr {
      page-break-inside: avoid; break-inside: avoid;
      page-break-after: auto;
    }
    .content thead { display: table-header-group; }
    .content tfoot { display: table-footer-group; }
    .content th, .content td {
      border: 1px solid #333; padding: 6px 10px; text-align: left;
      vertical-align: top;
    }
    .content th {
      background: #1a365d; color: #fff; font-weight: 600; font-size: 10pt;
    }
    .content tr:nth-child(even) td { background: #f5f5f5; }

    /* BI / ID blocks must not be split */
    .id-block, [data-pdf-block="id"], [data-pdf-block="bi"] {
      page-break-inside: avoid; break-inside: avoid;
    }

    /* ============ STATS / KPI ============ */
    .stats-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
      margin: 15px 0; break-inside: avoid;
    }
    .stat-box { border: 1px solid #333; padding: 12px; text-align: center; }
    .stat-box .value { font-size: 22pt; font-weight: 700; color: #1a365d; }
    .stat-box .label { font-size: 9pt; color: #555; margin-top: 4px; }

    .section { margin-bottom: 18px; }
    .section h2 {
      border-left: 4px solid #1a365d; padding-left: 10px;
    }

    /* ============ SIGNATURE — never split, never overlap footer ============ */
    .signature-block {
      margin-top: 50px;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
      page-break-before: auto;
    }
    .signature-block .location-date {
      text-align: left; font-style: italic;
      margin-bottom: 50px; font-size: 11pt;
    }
    .signature-block .signature-line {
      width: 60%; margin: 0 auto 6px;
      border-top: 1px solid #1a1a1a;
    }
    .signature-block .director-title,
    .signature-block .director-name {
      font-weight: 700; font-size: 12pt; text-transform: uppercase;
    }
    .signature-block .director-title { margin-bottom: 4px; }
    .user-info { text-align: left; margin-top: 24px; font-size: 10pt; color: #555; }

    /* ============ VERIFICATION PAGE ============ */
    .verification-page {
      page-break-before: always;
      break-before: page;
      padding-top: 10mm;
    }
    .verification-page h1 {
      text-align: center; font-size: 16pt; font-weight: 700;
      text-transform: uppercase; letter-spacing: 2px;
      border-bottom: 2px solid #1a365d; padding-bottom: 10px; margin-bottom: 24px;
    }
    .verify-grid {
      display: grid; grid-template-columns: 1fr 240px; gap: 24px; align-items: start;
    }
    .verify-fields { font-size: 11pt; line-height: 1.9; }
    .verify-fields .field { margin-bottom: 8px; }
    .verify-fields .label {
      display: inline-block; min-width: 170px;
      font-weight: 700; color: #1a365d; text-transform: uppercase; font-size: 9pt;
    }
    .verify-fields .value {
      font-family: 'Courier New', monospace; font-size: 10pt;
      word-break: break-all;
    }
    .verify-qr { text-align: center; }
    .verify-qr img {
      width: 220px; height: 220px; border: 1px solid #333; padding: 6px; background: #fff;
    }
    .verify-qr .qr-caption {
      margin-top: 8px; font-size: 9pt; color: #555;
    }
    .verify-instructions {
      margin-top: 30px; padding: 14px; border: 1px dashed #1a365d;
      background: #f8fafc; font-size: 10pt; line-height: 1.6;
    }
    .verify-instructions strong { color: #1a365d; }
    .verify-footnote {
      margin-top: 24px; text-align: center; font-size: 8pt; color: #888; font-style: italic;
    }

    @media print {
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="watermark">DMEN</div>

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
    <div class="signature-line"></div>
    <div class="director-title">O DIRECTOR MUNICIPAL</div>
    <div class="director-name">JORGE M. DOS SANTOS KENGELE DAVID</div>
    ${userName ? `<div class="user-info">Emitido por: ${escapeHtml(userName)}</div>` : ""}
  </section>

  ${verificationBlock}
</body>
</html>`;
}

// ============================================================
// VERIFICATION PAGE
// ============================================================

function renderVerificationPage(v: VerificationData): string {
  const issued = new Date(v.issueDate).toLocaleString("pt-AO");
  return `
  <section class="verification-page">
    <h1>Página de Verificação Documental</h1>

    <div class="verify-grid">
      <div class="verify-fields">
        <div class="field"><span class="label">Código Oficial:</span> <span class="value">${escapeHtml(v.documentCode)}</span></div>
        <div class="field"><span class="label">Nº Documento:</span> <span class="value">${escapeHtml(v.documentNumber)}</span></div>
        <div class="field"><span class="label">Município:</span> <span class="value">${escapeHtml(v.municipality)}</span></div>
        <div class="field"><span class="label">Data de Emissão:</span> <span class="value">${escapeHtml(issued)}</span></div>
        <div class="field"><span class="label">Hash SHA-256:</span><br/><span class="value">${escapeHtml(v.documentHash)}</span></div>
        <div class="field"><span class="label">Assinatura Digital:</span><br/><span class="value">${escapeHtml(v.signatureHash)}</span></div>
        <div class="field"><span class="label">URL Verificação:</span><br/><span class="value">${escapeHtml(v.verifyUrl)}</span></div>
      </div>
      <div class="verify-qr">
        <img src="${v.qrDataUrl}" alt="QR Code de Verificação" />
        <div class="qr-caption">Leitura via app/câmara</div>
      </div>
    </div>

    <div class="verify-instructions">
      <strong>Como verificar a autenticidade deste documento:</strong><br/>
      1. Aceda ao endereço de verificação acima ou leia o QR Code.<br/>
      2. Confirme se o <strong>Código Oficial</strong> e o <strong>Hash SHA-256</strong> coincidem com os exibidos no sistema oficial.<br/>
      3. Qualquer alteração ao conteúdo deste documento invalida automaticamente o hash e a assinatura digital.<br/>
      4. Em caso de divergência, contacte a Direcção Municipal da Educação (DMEN).
    </div>

    <div class="verify-footnote">
      Documento emitido electronicamente pelo Sistema de Gestão da Educação (DMEN-SIGE).<br/>
      Sistema desenvolvido por Áureo Chissanhino Maria da Silva — Advogado e Codificador Informático.
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
  // Wait for QR images to load before triggering print
  const trigger = () => {
    try {
      printWindow.print();
    } catch {
      /* noop */
    }
  };
  setTimeout(trigger, 700);
}
