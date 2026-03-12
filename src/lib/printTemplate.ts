/**
 * Template oficial de impressão A4 - Governo Provincial do Cunene
 * Direcção Municipal da Educação em Namacunde
 * 
 * Criado por: Áureo Chissanhino Maria da Silva
 * Advogado e Codificador Informático
 */

interface PrintTemplateOptions {
  title: string;
  content: string;
  userName?: string;
}

export function getOfficialPrintHTML({ title, content, userName }: PrintTemplateOptions): string {
  const dataAtual = new Date().toLocaleDateString("pt-AO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const horaAtual = new Date().toLocaleTimeString("pt-AO", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>${title} - DMN Gestor</title>
  <style>
    @page {
      size: A4;
      margin: 1.5cm 2cm;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #1a1a1a;
      font-size: 12pt;
      line-height: 1.6;
      position: relative;
      min-height: 100vh;
      padding-bottom: 100px;
    }

    /* ===== CABEÇALHO OFICIAL ===== */
    .official-header {
      text-align: center;
      padding-bottom: 20px;
      margin-bottom: 25px;
      border-bottom: 2px solid #333;
    }
    .official-header .brasao {
      width: 70px;
      height: auto;
      margin-bottom: 8px;
    }
    .official-header .gov-title {
      font-size: 13pt;
      font-weight: normal;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 2px;
      color: #1a1a1a;
    }
    .official-header .admin-title {
      font-size: 12pt;
      font-weight: normal;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 12px;
      color: #1a1a1a;
    }
    .official-header .direcao-title {
      font-size: 14pt;
      font-weight: bold;
      text-decoration: underline;
      letter-spacing: 1px;
      color: #1a1a1a;
    }

    /* ===== MARCA D'ÁGUA ===== */
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 120pt;
      font-weight: bold;
      color: rgba(0, 0, 0, 0.04);
      letter-spacing: 20px;
      white-space: nowrap;
      z-index: -1;
      pointer-events: none;
    }

    /* ===== TÍTULO DO DOCUMENTO ===== */
    .doc-title {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      margin: 20px 0 25px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ===== CONTEÚDO ===== */
    .content {
      font-size: 12pt;
      line-height: 1.8;
      text-align: justify;
    }
    .content table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 10pt;
    }
    .content th, .content td {
      border: 1px solid #333;
      padding: 6px 10px;
      text-align: left;
    }
    .content th {
      background: #1a365d;
      color: white;
      font-weight: 600;
      font-size: 10pt;
    }
    .content tr:nth-child(even) {
      background: #f5f5f5;
    }
    .content h2 {
      font-size: 13pt;
      color: #1a1a1a;
      margin: 20px 0 10px;
      font-weight: bold;
    }
    .content h3 {
      font-size: 12pt;
      color: #1a1a1a;
      margin: 15px 0 8px;
      font-weight: bold;
    }
    .content ul, .content ol {
      margin-left: 20px;
      margin-bottom: 10px;
    }
    .content p {
      margin-bottom: 8px;
    }

    /* ===== STATS GRID ===== */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin: 15px 0;
    }
    .stat-box {
      border: 1px solid #333;
      padding: 12px;
      text-align: center;
    }
    .stat-box .value {
      font-size: 22pt;
      font-weight: 700;
      color: #1a365d;
    }
    .stat-box .label {
      font-size: 9pt;
      color: #555;
      margin-top: 4px;
    }

    /* ===== SECÇÃO ===== */
    .section {
      margin-bottom: 20px;
    }
    .section h2 {
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 10px;
      border-left: 4px solid #1a365d;
      padding-left: 10px;
    }

    /* ===== ASSINATURA ===== */
    .signature-block {
      margin-top: 60px;
      text-align: center;
    }
    .signature-block .location-date {
      text-align: left;
      font-style: italic;
      margin-bottom: 40px;
      font-size: 11pt;
    }
    .signature-block .director-title {
      font-weight: bold;
      font-size: 12pt;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .signature-block .director-name {
      font-weight: bold;
      font-size: 12pt;
      text-transform: uppercase;
    }
    .user-info {
      text-align: left;
      margin-top: 30px;
      font-size: 10pt;
      color: #555;
    }

    /* ===== RODAPÉ OFICIAL ===== */
    .official-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 10px 2cm;
      border-top: 1px solid #ccc;
      font-size: 9pt;
      color: #555;
    }
    .official-footer .left-info {
      text-align: left;
      line-height: 1.5;
    }
    .official-footer .right-logo {
      text-align: right;
    }
    .official-footer .right-logo .gov-text {
      font-size: 10pt;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .official-footer .right-logo .gov-sub {
      font-size: 8pt;
      color: #333;
    }
    .official-footer .gov-angola-img {
      height: 35px;
      margin-bottom: 2px;
    }

    /* ===== CRIADOR ===== */
    .creator-credit {
      text-align: center;
      font-size: 7pt;
      color: #bbb;
      margin-top: 8px;
      font-style: italic;
    }

    @media print {
      body { padding: 0; }
      .watermark { position: fixed; }
      .official-footer { position: fixed; }
    }
  </style>
</head>
<body>
  <div class="watermark">DMEN</div>

  <div class="official-header">
    <img src="/images/brasao-angola.png" class="brasao" alt="Brasão de Angola" onerror="this.style.display='none'" />
    <div class="gov-title">GOVERNO PROVINCIAL DO CUNENE</div>
    <div class="admin-title">ADMINISTRAÇÃO MUNICIPAL DE NAMACUNDE</div>
    <div class="direcao-title">DIRECÇÃO DA EDUCAÇÃO</div>
  </div>

  <div class="doc-title">${title}</div>

  <div class="content">
    ${content}
  </div>

  <div class="signature-block">
    <div class="location-date">
      Direção Municipal da Educação em Namacunde, ${dataAtual}.
    </div>
    <div class="director-title">O DIRECTOR MUNICIPAL</div>
    <div class="director-name">JORGE M. DOS SANTOS KENGELE DAVID</div>
    ${userName ? `<div class="user-info">Usuário: ${userName}</div>` : ''}
  </div>

  <div class="official-footer">
    <div class="left-info">
      Direcção Municipal da Educação<br/>
      Tel: 924688671<br/>
      Email: rmectnamacunde@gmail.com
    </div>
    <div class="right-logo">
      <img src="/images/governo-angola-logo.png" class="gov-angola-img" alt="Governo de Angola" onerror="this.style.display='none'" />
      <div class="gov-sub">Cunene.gov.ao</div>
      <div class="gov-sub">Administração Municipal de Namacunde</div>
    </div>
  </div>

  <div class="creator-credit">
    Sistema desenvolvido por Áureo Chissanhino Maria da Silva — Advogado e Codificador Informático
  </div>
</body>
</html>`;
}

export function openPrintWindow(html: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 500);
}
