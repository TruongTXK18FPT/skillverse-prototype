/**
 * HTML Contract Generator - Vietnamese Labor Law Compliance (BLL 2019)
 * Full Unicode Vietnamese, proper page breaks, formal contract layout.
 *
 * PDF structure:
 *   Page 1 (fixed):  Header + Title + Parties table + Intro summary
 *   Content pages:  Clauses are paginated by measured content blocks
 *   Signature page:    Signature blocks
 *   All pages:         Footer with page number (Page X of Y)
 */

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Contract, ContractType } from "../../types/contract";

export interface ContractHTMLOptions {
  showWatermark?: string;
  filename?: string;
  scale?: number;
  imageType?: "JPEG" | "PNG";
  imageQuality?: number;
  pdfImageCompression?: "NONE" | "FAST" | "MEDIUM" | "SLOW";
}

const defaultOptions: ContractHTMLOptions = {
  filename: "hop-dong-lao-dong",
  scale: 1.0,
  imageType: "PNG",
  imageQuality: 1.0,
  pdfImageCompression: "FAST",
};

// ==================== PDF LAYOUT CONSTANTS ====================
// All page sizing is defined here and interpolated into CSS so preview,
// pagination, and PDF rendering stay in sync.
const PAGE_W = 210; // A4 width in mm
const PAGE_H = 297; // A4 height in mm
const BLOCK_GAP_MM = 4;

// Pixel conversion: 210mm -> 794px (A4 standard)
const PX_PER_MM = 794 / 210; // ≈ 3.781

const PAGE_W_PX = 794;
const PAGE_H_PX = 1123;
const PAGE_INNER_TOP_PX = 53;
const PAGE_INNER_LEFT_PX = 40;
const PAGE_INNER_W_PX = 714;
const PAGE_INNER_H_PX = 950;
const FOOTER_RESERVED_PX = 72;
const PAGE_CONTENT_H_PX = PAGE_INNER_H_PX - FOOTER_RESERVED_PX;

// ==================== FORMAT HELPERS ====================

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function fmtVnd(n?: number): string {
  if (!n) return "—";
  return formatCurrency(n);
}

function fmtBool(v?: boolean): string {
  return v === true ? "Có" : v === false ? "Không" : "—";
}

function fmtSalaryText(v?: string | null): string {
  return v && v.trim() ? v.trim() : "—";
}

function getCandidateDisplayName(c: Contract): string {
  return (
    c.candidateName?.trim() || c.candidateEmail || c.candidatePosition || "—"
  );
}

function normalizeText(value?: string | null, fallback = "—"): string {
  return value && value.trim() ? value.trim() : fallback;
}

function getPaymentMethodLabel(paymentMethod?: string): string {
  if (!paymentMethod) return "Chuyển khoản ngân hàng";
  return paymentMethod === "bank_transfer"
    ? "Chuyển khoản ngân hàng"
    : paymentMethod;
}

function buildPartiesTableHTML(c: Contract): string {
  const employerCompany = normalizeText(c.employerCompanyName);
  const employerAddress = c.employerCompanyAddress || "—";
  const employerTax = normalizeText(c.employerTaxId);
  const employerRep = normalizeText(c.employerName);
  const employerEmail = normalizeText(c.employerEmail);

  const candidateName = getCandidateDisplayName(c);
  const candidateEmail = normalizeText(c.candidateEmail);
  const candidatePosition = normalizeText(c.candidatePosition);

  return `
    <section class="table-section" style="margin-top: 16px;">
      <table class="formal-table party-table" style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
        <thead>
          <tr>
            <th class="party-column-heading" style="width: 50%; border: 1px solid #000; padding: 10px; background: #f5f5f5; text-align: center; font-weight: bold; font-size: 14px;">BÊN A - NGƯỜI SỬ DỤNG LAO ĐỘNG</th>
            <th class="party-column-heading" style="width: 50%; border: 1px solid #000; padding: 10px; background: #f5f5f5; text-align: center; font-weight: bold; font-size: 14px;">BÊN B - NGƯỜI LAO ĐỘNG</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #000; padding: 10px 12px; vertical-align: top;">
              <div style="display: flex; flex-direction: column; gap: 5px;">
                <div style="display: flex; gap: 8px; align-items: baseline;"><span style="font-weight: bold; white-space: nowrap;">Tên công ty:</span><span style="word-break: break-word; overflow-wrap: anywhere;">${employerCompany}</span></div>
                <div style="display: flex; gap: 8px; align-items: baseline;"><span style="font-weight: bold; white-space: nowrap;">Địa chỉ:</span><span style="word-break: break-word; overflow-wrap: anywhere;">${employerAddress}</span></div>
                <div style="display: flex; gap: 8px; align-items: baseline;"><span style="font-weight: bold; white-space: nowrap;">Mã số thuế:</span><span style="word-break: break-word; overflow-wrap: anywhere;">${employerTax}</span></div>
                <div style="display: flex; gap: 8px; align-items: baseline;"><span style="font-weight: bold; white-space: nowrap;">Đại diện:</span><span style="word-break: break-word; overflow-wrap: anywhere;">${employerRep}</span></div>
                <div style="display: flex; gap: 8px; align-items: baseline;"><span style="font-weight: bold; white-space: nowrap;">Email:</span><span style="word-break: break-word; overflow-wrap: anywhere;">${employerEmail}</span></div>
              </div>
            </td>
            <td style="border: 1px solid #000; padding: 10px 12px; vertical-align: top;">
              <div style="display: flex; flex-direction: column; gap: 5px;">
                <div style="display: flex; gap: 8px; align-items: baseline;"><span style="font-weight: bold; white-space: nowrap;">Họ và tên:</span><span style="word-break: break-word; overflow-wrap: anywhere;">${candidateName}</span></div>
                <div style="display: flex; gap: 8px; align-items: baseline;"><span style="font-weight: bold; white-space: nowrap;">Chức danh:</span><span style="word-break: break-word; overflow-wrap: anywhere;">${candidatePosition}</span></div>
                <div style="display: flex; gap: 8px; align-items: baseline;"><span style="font-weight: bold; white-space: nowrap;">Email:</span><span style="word-break: break-word; overflow-wrap: anywhere;">${candidateEmail}</span></div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>`;
}

function buildOverviewTableHTML(c: Contract): string {
  const position = normalizeText(c.candidatePosition || c.jobTitle);
  const location = normalizeText(c.workingLocation);
  const startDate = c.startDate ? formatDate(c.startDate) : "—";
  const endDate = c.endDate ? formatDate(c.endDate) : "—";
  const probMonths = c.probationMonths ? `${c.probationMonths} tháng` : "—";

  return `
    <section style="margin-top: 14px; font-size: 13px; line-height: 1.7;">
      <h3 style="font-weight: bold; font-size: 13px; margin-bottom: 8px;">Điều khoản chung</h3>
      <div>
        <div>Công việc: <strong>${position}</strong></div>
        <div>Địa điểm làm việc: <strong>${location}</strong></div>
        <div>Ngày bắt đầu: <strong>${startDate}</strong></div>
        <div>Ngày kết thúc: <strong>${endDate}</strong></div>
        <div>Thời gian thử việc: <strong>${probMonths}</strong></div>
      </div>
    </section>`;
}

function buildContractHeaderHTML(
  contractNumber: string,
  today: string,
  contractTitle: string,
  contractTitleEn: string,
): string {
  return `
    <section class="hero-block" style="padding: 0 0 8px 0;">
      <div class="doc-header" style="text-align: center; margin-bottom: 12px;">
        <div class="republic-banner" style="font-size: 13pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div class="independence-banner" style="font-size: 12pt; margin-top: 3px;">Độc lập - Tự do - Hạnh phúc</div>
      </div>
      <div class="contract-meta" style="display: flex; justify-content: space-between; font-style: italic; font-size: 11pt; margin-bottom: 6px;">
        <span class="contract-meta-item contract-meta-num">Số: ${contractNumber}</span>
        <span class="contract-meta-item contract-meta-date">Ngày ký: ${today}</span>
      </div>
      <hr style="border: none; border-top: 2px solid #000; margin: 0 0 12px 0;" />
      <h1 class="doc-title" style="text-align: center; font-size: 22pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">${contractTitle}</h1>
      <div class="doc-title-en" style="text-align: center; font-size: 12pt; font-style: italic; color: #4a4a4a;">${contractTitleEn}</div>
    </section>`;
}

function buildContractIntroHTML(c: Contract): string {
  return `
    <section class="intro-panel" style="margin-top: 16px; font-size: 13px; line-height: 1.7;">
      <p style="margin-bottom: 6px;">Căn cứ Bộ luật Lao động nước Cộng hòa xã hội chủ nghĩa Việt Nam năm 2019;</p>
      <p style="margin-bottom: 6px;">Căn cứ nhu cầu và năng lực của hai bên,</p>
      <p style="margin-bottom: 12px;">Hôm nay, ngày <strong>${formatDate(new Date().toISOString())}</strong>, tại <strong>${normalizeText(c.employerCompanyAddress, "—")}</strong>,</p>
      <p style="margin-bottom: 0;">Chúng tôi gồm:</p>
    </section>`;
}

function buildSalaryBoxHTML(c: Contract): string {
  const probSalary = c.probationSalary || c.salary || 0;
  const probSalaryText = fmtSalaryText(c.probationSalaryText || c.salaryText);

  return `
    <section class="salary-box" style="border: 2px solid #000; padding: 14px 20px; text-align: center; margin: 14px 0;">
      <div class="salary-label" style="font-size: 13px; font-weight: bold; margin-bottom: 10px;">Mức lương hàng tháng</div>
      <div class="salary-amount" style="font-size: 22px; font-weight: bold; margin-bottom: 6px;">${formatCurrency(probSalary).replace("₫", "đ")}</div>
      <div class="salary-text" style="font-style: italic; font-size: 12px;">${probSalaryText && probSalaryText !== "—" ? `Bằng chữ: ${probSalaryText}` : ""}</div>
    </section>`;
}

// ==================== CONTRACT TITLE ====================

function getContractTitle(type: ContractType): string {
  switch (type) {
    case ContractType.PROBATION:
      return "HỢP ĐỒNG THỬ VIỆC";
    case ContractType.FULL_TIME:
      return "HỢP ĐỒNG LAO ĐỘNG";
    case ContractType.PART_TIME:
      return "HỢP ĐỒNG LAO ĐỘNG BÁN THỜI GIAN";
    default:
      return "HỢP ĐỒNG LAO ĐỘNG";
  }
}

function getContractTitleEn(type: ContractType): string {
  switch (type) {
    case ContractType.PROBATION:
      return "LABOR CONTRACT (PROBATION PERIOD)";
    case ContractType.FULL_TIME:
      return "LABOR CONTRACT";
    case ContractType.PART_TIME:
      return "PART-TIME LABOR CONTRACT";
    default:
      return "LABOR CONTRACT";
  }
}

// ==================== MARKDOWN → HTML (lightweight) ====================

function markdownToHtml(md: string): string {
  if (!md) return "";

  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/^\|(.+)\|$/gm, (line) => {
    const cells = line.split("|").slice(1, -1);
    if (line.match(/^\|[-:\s]+\|$/)) return "";
    return cells
      .map(
        (c) =>
          `<td style="padding:5px 8px;border:1px solid #333;vertical-align:top;">${c.trim()}</td>`,
      )
      .join("");
  });
  html = html.replace(
    /(<td[^>]*>[\s\S]*?<\/td>\s*)+/g,
    (match) => `<tr>${match}</tr>`,
  );
  html = html.replace(
    /(<tr>[\s\S]*?<\/tr>\s*)+/g,
    (match) =>
      `<table style="width:100%;border-collapse:collapse;margin:6px 0;font-size:10pt;border:1px solid #333;">${match}</table>`,
  );

  html = html.replace(
    /^### (.+)$/gm,
    '<h4 style="font-size:11pt;font-weight:700;margin:10px 0 3px;color:#1a1a1a;">$1</h4>',
  );
  html = html.replace(
    /^## (.+)$/gm,
    '<h3 style="font-size:12pt;font-weight:700;margin:12px 0 4px;color:#1a1a1a;">$1</h3>',
  );
  html = html.replace(
    /^# (.+)$/gm,
    '<h2 style="font-size:13pt;font-weight:700;margin:14px 0 6px;color:#1a1a1a;">$1</h2>',
  );

  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

  html = html.replace(
    /`([^`]+)`/g,
    '<code style="padding:1px 4px;background:#f3f4f6;border-radius:3px;font-size:10pt;">$1</code>',
  );

  html = html.replace(/```[\s\S]*?```/g, (match) => {
    const code = match.replace(/```[^\n]*\n?/, "").replace(/```$/, "");
    return `<pre style="background:#1e293b;color:#e2e8f0;padding:8px;border-radius:4px;margin:6px 0;font-size:9pt;overflow-x:auto;">${code.trim()}</pre>`;
  });

  html = html.replace(
    /^&gt; (.+)$/gm,
    '<blockquote style="border-left:3px solid #3b82f6;padding:3px 10px;margin:6px 0;background:#f8fafc;">$1</blockquote>',
  );

  html = html.replace(
    /^[-*+] (.+)$/gm,
    '<li style="margin:2px 0 2px 14px;color:#334155;">$1</li>',
  );
  html = html.replace(
    /(<li[^>]*>[\s\S]*?<\/li>\s*)+/g,
    (match) => `<ul style="margin:4px 0;padding-left:18px;">${match}</ul>`,
  );

  html = html.replace(
    /^\d+\. (.+)$/gm,
    '<li style="margin:2px 0 2px 14px;color:#334155;">$1</li>',
  );

  html = html.replace(
    /^---+$/gm,
    '<hr style="border:none;border-top:1px solid #e2e8f0;margin:10px 0;" />',
  );

  html = html.replace(
    /\n\n+/g,
    '</p><p style="text-align:justify;margin:5px 0;">',
  );
  html = `<p style="text-align:justify;margin:5px 0;">${html}</p>`;
  html = html.replace(/<p style="text-align:justify;margin:5px 0;"><\/p>/g, "");
  html = html.replace(
    /<p style="text-align:justify;margin:5px 0;"><br\s*\/?><\/p>/g,
    "",
  );
  html = html.replace(
    /<p style="text-align:justify;margin:5px 0;"><br\s*\/?>/g,
    '<p style="text-align:justify;margin:5px 0;">',
  );
  html = html.replace(/<br\s*\/?><\/p>/g, "</p>");

  return html;
}

// ==================== CLAUSE GENERATORS (Unicode Vietnamese) ====================

function genProbClauses(c: Contract): string {
  const position = normalizeText(c.candidatePosition);
  const location = normalizeText(c.workingLocation);
  const startDate = c.startDate ? formatDate(c.startDate) : "—";
  const endDate = c.endDate ? formatDate(c.endDate) : "—";
  const probMonths = c.probationMonths || 1;
  const termDays = c.terminationNoticeDays || 30;

  return `
<h3 class="clause-title" style="font-size: 13pt; margin-top: 14px;">Điều 1: Nội dung công việc</h3>
<p class="clause-text">Bên B được giao thực hiện công việc với vị trí <strong>${position}</strong> tại ${location}, thời gian thử việc tính từ ngày ${startDate}.</p>
<p class="clause-text" style="font-weight: bold; margin-top: 6px;">Mô tả công việc</p>
${c.jobDescription ? `<div class="clause-sub">${markdownToHtml(c.jobDescription)}</div>` : ""}
${c.probationObjectives ? `<p class="clause-text" style="font-weight: bold; margin-top: 6px;">Mục tiêu thử việc:</p><div class="clause-sub">${markdownToHtml(c.probationObjectives)}</div>` : ""}
${c.probationEvaluationCriteria ? `<p class="clause-text" style="font-weight: bold; margin-top: 6px;">Tiêu chí đánh giá:</p><div class="clause-sub">${markdownToHtml(c.probationEvaluationCriteria)}</div>` : ""}

<h3 class="clause-title" style="font-size: 13pt; margin-top: 14px;">Điều 2: Thời hạn hợp đồng thử việc</h3>
<p class="clause-text">Thời gian thử việc: <strong>${probMonths} tháng</strong>, tối đa không quá 60 ngày (BLL 2019 Điều 27).</p>
<p class="clause-text">Ngày bắt đầu: <strong>${startDate}</strong> - Ngày kết thúc: <strong>${endDate}</strong>.</p>
<p class="clause-text">Mỗi bên có quyền chấm dứt trước thời hạn với thời hạn báo trước là <strong>${termDays} ngày làm việc</strong>.</p>
<p class="clause-text" style="font-weight: bold; margin-top: 6px;">Điều khoản chấm dứt hợp đồng thử việc:</p>
<p class="clause-text">Trong thời gian thử việc, mỗi bên có quyền đơn phương chấm dứt HĐL thử việc trước thời hạn với điều kiện:</p>
<ul class="clause-list" style="list-style-type: disc;">
  <li><strong>Bên A (Nhà tuyển dụng) chấm dứt:</strong> Phải báo trước ít nhất <strong>03 ngày làm việc</strong> cho Bên B, nêu rõ lý do không đạt yêu cầu thử việc.</li>
  <li><strong>Bên B (Người lao động) chấm dứt:</strong> Phải báo trước ít nhất <strong>03 ngày làm việc</strong> cho Bên A.</li>
  <li><strong>Thanh lý:</strong> Trong vòng 07 ngày làm việc kể từ ngày chấm dứt, hai bên tiến hành thanh toán các khoản: lương thử việc tính đến ngày nghỉ, các khoản phụ cấp (nếu có), và hoàn trả tài sản, thiết bị của Bên A.</li>
</ul>

<h3 class="clause-title" style="font-size: 13pt; margin-top: 14px;">Điều 3: Tiền lương và thanh toán</h3>
<p class="clause-text">Mức lương thử việc: <strong>${formatCurrency(c.probationSalary || c.salary || 0).replace("₫", "đ")} / tháng</strong>.</p>
<p class="clause-text">Hình thức trả lương: ${getPaymentMethodLabel(c.paymentMethod)}.</p>
<p class="clause-text">Ngày trả lương: Ngày ${c.salaryPaymentDate || 10} hàng tháng.</p>

<h3 class="clause-title" style="font-size: 13pt; margin-top: 14px;">Điều 4: Phụ cấp & Lợi ích trong thử việc</h3>
<p class="clause-text">Lưu ý: Trong thời gian thử việc, Bên B không phải tham gia BHXH, BHTN theo quy định pháp luật hiện hành.</p>
<p class="clause-text">Bên B được hưởng chế độ nghỉ phép năm: <strong>${c.annualLeaveDays || 0} ngày</strong>.</p>

<h3 class="clause-title" style="font-size: 13pt; margin-top: 14px;">Điều 5: Chấm dứt hợp đồng thử việc</h3>
<p class="clause-text"><strong>Quyền của Bên A:</strong> Đơn phương chấm dứt nếu Bên B không đáp ứng yêu cầu công việc, với thời hạn báo trước ${termDays} ngày làm việc.</p>
<p class="clause-text"><strong>Quyền của Bên B:</strong> Đơn phương chấm dứt với thời hạn báo trước ${termDays} ngày làm việc.</p>

<h3 class="clause-title" style="font-size: 13pt; margin-top: 14px;">Điều 6: Điều khoản bổ sung</h3>
<p class="clause-text" style="font-weight: bold;">Các điều khoản bổ sung:</p>
${c.legalText ? `<div class="clause-sub">${markdownToHtml(c.legalText)}</div>` : ""}
`;
}

function genFullClauses(c: Contract): string {
  const position = c.candidatePosition || "—";
  const location = c.workingLocation || "—";
  const sal = fmtVnd(c.salary);
  const salText = fmtSalaryText(c.salaryText);
  const payDate = c.salaryPaymentDate || 10;
  const payMethod =
    c.paymentMethod === "bank_transfer"
      ? "Chuyển khoản ngân hàng"
      : c.paymentMethod || "Chuyển khoản ngân hàng";
  const meal = fmtVnd(c.mealAllowance);
  const transport = fmtVnd(c.transportAllowance);
  const housing = fmtVnd(c.housingAllowance);
  const whDay = c.workingHoursPerDay || 8;
  const whWeek = c.workingHoursPerWeek || 40;
  const annualLeave = c.annualLeaveDays || 12;
  const termDays = c.terminationNoticeDays || 30;
  const insurance = c.insurancePolicy || "Theo quy định pháp luật hiện hành.";
  const healthCheckup = fmtBool(c.healthCheckupAnnual);

  return `
<h3 class="clause-title">Điều 1. Nghĩa vụ của Người Lao động (Bên B)</h3>
<p class="clause-text">Vị trí công việc: <strong>${position}</strong>. Địa điểm làm việc: <strong>${location}</strong>.</p>
${c.jobDescription ? `<div class="clause-sub">${markdownToHtml(c.jobDescription)}</div>` : ""}
<ul class="clause-list">
  <li>Thực hiện công việc đúng vị trí, chức danh, địa điểm đã thỏa thuận.</li>
  <li>Tuân thủ nội quy lao động, quy chế và các quy định nội bộ của Bên A.</li>
  <li>Hoàn thành công việc đúng tiến độ, đảm bảo chất lượng theo yêu cầu.</li>
  <li>Bảo vệ tài sản, bí quyết công nghệ và thông tin của Bên A.</li>
  <li>Thực hiện các nghĩa vụ khác theo quy định của pháp luật và thỏa thuận trong hợp đồng này.</li>
</ul>

<h3 class="clause-title">Điều 2. Nghĩa vụ của Người sử dụng Lao động (Bên A)</h3>
<ul class="clause-list">
  <li>Cung cấp đầy đủ việc làm, điều kiện cần thiết để Bên B hoàn thành công việc.</li>
  <li>Trả lương đúng hạn, đầy đủ theo thỏa thuận tại Điều 4 hợp đồng này.</li>
  <li>Đóng bảo hiểm xã hội (BHXH), bảo hiểm y tế (BHYT), bảo hiểm thất nghiệp (BHTN) theo quy định pháp luật. Chi tiết: ${insurance}</li>
  <li>Khám sức khỏe định kỳ hàng năm cho Bên B: <strong>${healthCheckup}</strong>.</li>
  <li>Đảm bảo an toàn, vệ sinh lao động tại nơi làm việc.</li>
  <li>Tôn trọng danh dự, nhân phẩm của Bên B; không phân biệt đối xử.</li>
</ul>

<h3 class="clause-title">Điều 3. Thời giờ làm việc và thời giờ nghỉ ngơi</h3>
<ul class="clause-list">
  <li>Thời giờ làm việc: <strong>${whDay} giờ/ngày</strong>, <strong>${whWeek} giờ/tuần</strong> (theo Điều 104 Bộ luật Lao động 2019).</li>
  ${c.workingSchedule ? `<li>Ca làm việc: <strong>${c.workingSchedule}</strong>.</li>` : ""}
  <li>Nghỉ hằng tuần: ít nhất <strong>01 ngày</strong> vào cuối tuần.</li>
  <li>Nghỉ phép năm: <strong>${annualLeave} ngày</strong> làm việc cho mỗi năm đầy đủ (theo Điều 113 Bộ luật Lao động 2019).</li>
</ul>
${c.remoteWorkPolicy ? `<div class="clause-sub"><strong>Chính sách làm việc từ xa (WFH):</strong> ${markdownToHtml(c.remoteWorkPolicy)}</div>` : ""}
${c.leavePolicy ? `<div class="clause-sub"><strong>Chính sách nghỉ phép chi tiết:</strong> ${markdownToHtml(c.leavePolicy)}</div>` : ""}

<h3 class="clause-title">Điều 4. Tiền lương và phương thức thanh toán</h3>
<p class="clause-text">Mức lương: <strong>${sal}</strong>${salText !== "—" ? ` (${salText})` : ""}.</p>
<p class="clause-text">Ngày thanh toán lương: Ngày <strong>${payDate}</strong> hàng tháng.</p>
<p class="clause-text">Phương thức thanh toán: <strong>${payMethod}</strong>.</p>
<p class="clause-text">Phụ cấp ăn: <strong>${meal}</strong></p>
<p class="clause-text">Phụ cấp đi lại: <strong>${transport}</strong></p>
<p class="clause-text">Phụ cấp nhà ở: <strong>${housing}</strong></p>
${c.otherAllowances ? `<div class="clause-sub">${markdownToHtml(c.otherAllowances)}</div>` : ""}
${c.bonusPolicy ? `<div class="clause-sub"><strong>Chính sách thưởng:</strong> ${markdownToHtml(c.bonusPolicy)}</div>` : ""}

<h3 class="clause-title">Điều 5. Đào tạo và phúc lợi</h3>
${c.trainingPolicy ? `<div class="clause-sub">${markdownToHtml(c.trainingPolicy)}</div>` : '<p class="clause-text">Các chế độ đào tạo, phúc lợi (nếu có) được thực hiện theo quy chế của Bên A.</p>'}
${c.otherBenefits ? `<div class="clause-sub"><strong>Các phúc lợi khác:</strong> ${markdownToHtml(c.otherBenefits)}</div>` : ""}

<h3 class="clause-title">Điều 6. Bảo mật thông tin và sở hữu trí tuệ</h3>
${
  c.confidentialityClause
    ? markdownToHtml(c.confidentialityClause)
    : `<p class="clause-text"><strong>Bảo mật thông tin:</strong> Bên B cam kết bảo mật mọi thông tin liên quan đến hoạt động kinh doanh, kỹ thuật, tài chính và khách hàng của Bên A. Nghĩa vụ bảo mật có hiệu lực trong thời gian làm việc và vô thời hạn sau khi chấm dứt hợp đồng lao động.</p>`
}
${
  c.ipClause
    ? markdownToHtml(c.ipClause)
    : `<p class="clause-text"><strong>Sở hữu trí tuệ:</strong> Các sáng chế, sáng kiến, cải tiến kỹ thuật, thiết kế, nhãn hiệu, bản quyền do Bên B tạo ra trong quá trình thực hiện công việc thuộc quyền sở hữu của Bên A.</p>`
}

<h3 class="clause-title">Điều 7. Trách nhiệm cạnh tranh</h3>
${
  c.nonCompeteClause
    ? `<p class="clause-text"><strong>Có điều khoản cạnh tranh.</strong>${c.nonCompeteDurationMonths ? ` Thời gian cạnh tranh sau khi nghỉ việc: <strong>${c.nonCompeteDurationMonths} tháng</strong> theo Điều 62 Bộ luật Lao động 2019.` : ""}</p>`
    : `<p class="clause-text">Trong thời gian làm việc và sau khi nghỉ việc, Bên B không được làm việc cho các tổ chức, cá nhân cạnh tranh trực tiếp với Bên A khi chưa được sự đồng ý bằng văn bản.</p>`
}

<h3 class="clause-title">Điều 8. Chấm dứt hợp đồng lao động</h3>
<p class="clause-text">Thời hạn báo trước khi đơn phương chấm dứt hợp đồng: <strong>ít nhất ${termDays} ngày</strong> (theo Điều 35, Điều 36 Bộ luật Lao động 2019).</p>
${c.terminationClause ? `<div class="clause-sub">${markdownToHtml(c.terminationClause)}</div>` : ""}
<p class="clause-text">Hợp đồng lao động có thể chấm dứt trong các trường hợp:</p>
<ul class="clause-list">
  <li>Hai bên thỏa thuận chấm dứt hợp đồng lao động.</li>
  <li>Đơn phương chấm dứt theo Điều 35 và Điều 36 Bộ luật Lao động 2019.</li>
  <li>Bên A đơn phương chấm dứt do Bên B vi phạm kỷ luật lao động (Điều 125 BLL 2019).</li>
  <li>Hết thời hạn ghi trong hợp đồng (đối với hợp đồng xác định thời hạn).</li>
</ul>

<h3 class="clause-title">Điều 9. Giải quyết tranh chấp lao động</h3>
<p class="clause-text">Tranh chấp phát sinh từ hợp đồng này được giải quyết thông qua thương lượng, hòa giải giữa hai bên trên tinh thần thiện chí và hợp tác. Trường hợp không thể thương lượng, các bên có quyền yêu cầu giải quyết tại Hội đồng hòa giải cơ sở hoặc Hội đồng hòa giải lao động cấp huyện, hoặc Tòa án nhân dân có thẩm quyền theo quy định pháp luật.</p>

<h3 class="clause-title">Điều 10. Điều khoản bổ sung</h3>
${c.legalText ? `<div class="clause-sub">${markdownToHtml(c.legalText)}</div>` : '<p class="clause-text">Các điều khoản bổ sung (nếu có) sẽ được ghi nhận tại Phụ lục hợp đồng đính kèm, có giá trị pháp lý như hợp đồng này.</p>'}
`;
}

function genPartClauses(c: Contract): string {
  const position = c.candidatePosition || "—";
  const startDate = formatDate(c.startDate);
  const endDate = c.endDate ? formatDate(c.endDate) : "—";
  const sal = fmtVnd(c.salary);
  const salText = fmtSalaryText(c.salaryText);
  const payDate = c.salaryPaymentDate || 10;
  const payMethod =
    c.paymentMethod === "bank_transfer"
      ? "Chuyển khoản ngân hàng"
      : c.paymentMethod || "Chuyển khoản ngân hàng";
  const whWeek = c.workingHoursPerWeek
    ? Math.round(c.workingHoursPerWeek / 2)
    : 20;
  const whDay = c.workingHoursPerDay || 4;
  const meal = fmtVnd(c.mealAllowance);
  const transport = fmtVnd(c.transportAllowance);
  const annualLeave = c.annualLeaveDays;
  const termDays = c.terminationNoticeDays || 15;

  return `
<h3 class="clause-title">Điều 1. Nội dung và thời hạn công việc</h3>
<p class="clause-text">Bên B được giao thực hiện công việc với vị trí: <strong>${position}</strong>.</p>
<p class="clause-text">Thời gian: Từ ngày <strong>${startDate}</strong> đến ngày <strong>${endDate}</strong>.</p>
${c.jobDescription ? `<div class="clause-sub">${markdownToHtml(c.jobDescription)}</div>` : ""}

<h3 class="clause-title">Điều 2. Thời giờ làm việc</h3>
<p class="clause-text">Bên B làm việc không quá <strong>${whWeek} giờ/tuần</strong> và không quá <strong>${whDay} giờ/ngày</strong> (bằng 1/2 thời giờ làm việc bình thường của người lao động toàn thời gian theo Điều 143 Bộ luật Lao động 2019).</p>
${c.workingSchedule ? `<p class="clause-text">Ca làm việc: <strong>${c.workingSchedule}</strong>.</p>` : ""}

<h3 class="clause-title">Điều 3. Tiền lương và phương thức thanh toán</h3>
<p class="clause-text">Mức lương: <strong>${sal}</strong>${salText !== "—" ? ` (${salText})` : ""}.</p>
<p class="clause-text">Ngày thanh toán lương: Ngày <strong>${payDate}</strong> hàng tháng.</p>
<p class="clause-text">Phương thức thanh toán: <strong>${payMethod}</strong>.</p>
<p class="clause-text"><em>Lưu ý: Tiền lương của Bên B không được thấp hơn mức lương tối thiểu vùng do Chính phủ quy định.</em></p>
<p class="clause-text">Phụ cấp ăn: <strong>${meal}</strong></p>
<p class="clause-text">Phụ cấp đi lại: <strong>${transport}</strong></p>
${c.otherAllowances ? `<div class="clause-sub">${markdownToHtml(c.otherAllowances)}</div>` : ""}
${c.bonusPolicy ? `<div class="clause-sub"><strong>Chính sách thưởng:</strong> ${markdownToHtml(c.bonusPolicy)}</div>` : ""}

<h3 class="clause-title">Điều 4. Quyền và nghĩa vụ</h3>
<p class="clause-text">Bên B được hưởng các quyền và thực hiện nghĩa vụ tương tự lao động toàn thời gian, phù hợp với tính chất công việc bán thời gian, theo quy định tại Chương XI Bộ luật Lao động 2019.</p>
${annualLeave ? `<p class="clause-text">Nghỉ phép năm: <strong>${annualLeave} ngày/năm</strong> (tính theo tỷ lệ thời gian làm việc so với lao động toàn thời gian).</p>` : ""}
${c.leavePolicy ? `<div class="clause-sub">${markdownToHtml(c.leavePolicy)}</div>` : ""}
${c.insurancePolicy ? `<div class="clause-sub"><strong>Bảo hiểm:</strong> ${markdownToHtml(c.insurancePolicy)}</div>` : ""}

<h3 class="clause-title">Điều 5. Bảo mật thông tin và sở hữu trí tuệ</h3>
${
  c.confidentialityClause
    ? markdownToHtml(c.confidentialityClause)
    : `<p class="clause-text"><strong>Bảo mật thông tin:</strong> Bên B cam kết bảo mật mọi thông tin liên quan đến hoạt động kinh doanh, kỹ thuật, tài chính và khách hàng của Bên A.</p>`
}
${c.ipClause ? markdownToHtml(c.ipClause) : ""}

<h3 class="clause-title">Điều 6. Chấm dứt hợp đồng lao động</h3>
<p class="clause-text">Thời hạn báo trước khi đơn phương chấm dứt hợp đồng: <strong>ít nhất ${termDays} ngày</strong> (theo Điều 35, Điều 36 Bộ luật Lao động 2019).</p>
${c.terminationClause ? `<div class="clause-sub">${markdownToHtml(c.terminationClause)}</div>` : ""}
<p class="clause-text">Việc chấm dứt hợp đồng thực hiện theo Điều 35, Điều 36, Điều 37 và Điều 38 Bộ luật Lao động 2019.</p>

<h3 class="clause-title">Điều 7. Điều khoản bổ sung</h3>
${c.legalText ? `<div class="clause-sub">${markdownToHtml(c.legalText)}</div>` : '<p class="clause-text">Các điều khoản bổ sung (nếu có) sẽ được ghi nhận tại Phụ lục hợp đồng đính kèm.</p>'}
`;
}

// ==================== SHARED CSS ====================

const SHARED_CSS = `
:root {
  --ink: #000000;
  --muted: #4a4a4a;
  --border: #000000;
  --border-strong: #000000;
  --panel: #ffffff;
  --panel-strong: #f5f5f5;
  --accent: #000000;
  --preview-scale: 1;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  margin: 0;
  background: #f0f0f0;
  font-family: 'Times New Roman', Times, serif;
  font-size: 15px;
  line-height: 1.6;
  color: var(--ink);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.contract-preview {
  padding: 16px 0 36px;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}
.page-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(20px * var(--preview-scale, 1));
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}
.preview-page-shell {
  width: calc(${PAGE_W_PX}px * var(--preview-scale, 1));
  height: calc(${PAGE_H_PX}px * var(--preview-scale, 1));
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex: 0 0 auto;
}
.contract-page {
  width: ${PAGE_W_PX}px;
  height: ${PAGE_H_PX}px;
  max-width: 100%;
  background: #ffffff;
  position: relative;
  overflow: hidden;
}
.preview-page-shell .contract-page {
  transform: scale(var(--preview-scale, 1));
  transform-origin: top center;
}
.contract-page--preview {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}
.page-inner {
  position: absolute;
  top: ${PAGE_INNER_TOP_PX}px;
  left: ${PAGE_INNER_LEFT_PX}px;
  width: ${PAGE_INNER_W_PX}px;
  height: ${PAGE_INNER_H_PX}px;
  overflow: visible;
}
.page-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 100%;
  padding-bottom: ${FOOTER_RESERVED_PX}px;
}
.page-watermark {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80px;
  font-weight: 700;
  letter-spacing: 8px;
  color: rgba(0, 0, 0, 0.05);
  text-transform: uppercase;
  transform: rotate(-45deg);
  pointer-events: none;
  z-index: 1;
}
.page-inner > * {
  position: relative;
  z-index: 2;
}
.hero-block {
  padding-bottom: 10px;
}
.doc-header {
  text-align: center;
}
.republic-banner {
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.independence-banner {
  margin-top: 5px;
  font-size: 16px;
  font-weight: bold;
}
.contract-meta {
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-style: italic;
}
.header-line {
  margin: 10px auto;
  border-top: 2px solid var(--ink);
  width: 50%;
}
h1.doc-title {
  margin-top: 40px;
  text-align: center;
  font-size: 26px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
}
.doc-title-en {
  margin-top: 8px;
  text-align: center;
  font-size: 15px;
  font-style: italic;
  color: var(--muted);
}
.flow-block {
  width: 100%;
  max-width: 100%;
}
.formal-table {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1px solid var(--border-strong);
  background: #ffffff;
}
.formal-table th,
.formal-table td {
  border: 1px solid var(--border);
  padding: 10px 12px;
  font-size: 15px;
  vertical-align: top;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.party-column-heading,
.table-section-title {
  background: var(--panel-strong);
  text-align: center;
  text-transform: uppercase;
  font-size: 15px;
  font-weight: 700;
}
.field-label {
  width: 25%;
  font-weight: 700;
  text-align: left;
}
.field-value {
  width: 75%;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.summary-table .field-label {
  width: 25%;
}
.summary-table .field-value {
  width: 25%;
}
.salary-box {
  border: 2px solid var(--border-strong);
  padding: 20px;
  text-align: center;
  margin: 20px 0;
}
.salary-label {
  font-size: 16px;
  font-weight: 700;
}
.salary-amount {
  margin-top: 10px;
  font-size: 22px;
  font-weight: 700;
}
.salary-text {
  margin-top: 6px;
  font-size: 14px;
  font-style: italic;
}
.clause-copy,
.clause-fragment {
  width: 100%;
  max-width: 100%;
}
.clause-title {
  margin: 14px 0 6px;
  font-size: 16px;
  font-weight: 700;
}
.clause-title--continued {
  color: var(--muted);
}
.clause-text {
  font-size: 15px;
  text-align: justify;
  margin: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.clause-text + .clause-text {
  margin-top: 8px;
}
.clause-sub {
  font-size: 15px;
  text-align: justify;
  margin-top: 8px;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.clause-sub > :first-child {
  margin-top: 0;
}
.clause-sub > :last-child {
  margin-bottom: 0;
}
.clause-list {
  margin: 8px 0;
  padding-left: 24px;
  font-size: 15px;
  text-align: justify;
  max-width: 100%;
}
.clause-list li {
  margin-bottom: 6px;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.clause-list--fragment {
  padding-left: 24px;
}
.signature-section {
  border: 1px solid var(--border-strong);
  padding: 20px;
  margin-top: 20px;
  page-break-inside: avoid;
  max-width: 100%;
}
.signature-section-title {
  text-align: center;
  text-transform: uppercase;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 15px;
}
.signature-intro {
  text-align: center;
  font-size: 15px;
  margin-bottom: 20px;
}
.signature-table {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.signature-table th,
.signature-table td {
  border: none;
  padding: 10px;
  vertical-align: top;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.signature-table th {
  text-transform: uppercase;
  font-size: 16px;
  font-weight: bold;
}
.signature-block {
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  text-align: center;
}
.signature-company {
  font-size: 14px;
  color: var(--muted);
  font-style: italic;
  margin-bottom: 10px;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.signature-space {
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}
.signature-line {
  width: 70%;
  border-top: 1px dashed var(--ink);
  border-bottom: none;
  height: 1px;
}
.signature-img {
  max-width: 180px;
  max-height: 80px;
  object-fit: contain;
  display: block;
}
.signature-name {
  font-size: 16px;
  font-weight: 700;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.signature-date {
  margin-top: 6px;
  font-size: 14px;
  color: var(--muted);
}
.signature-note {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: var(--muted);
  font-style: italic;
}
.page-footer {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  border-top: 1px solid var(--border);
  padding-top: 8px;
  padding-bottom: 4px;
  font-size: 13px;
  line-height: 1.35;
  color: var(--ink);
}
.page-footer__table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.page-footer__left {
  text-align: left;
  width: 33.333%;
  vertical-align: middle;
  padding-right: 6px;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.page-footer__center {
  text-align: center;
  font-style: italic;
  width: 33.333%;
  vertical-align: middle;
  padding: 0 4px;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.page-footer__right {
  text-align: right;
  width: 33.333%;
  vertical-align: middle;
  padding-left: 6px;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.preview-longform {
  width: ${PAGE_W_PX}px;
  min-height: ${PAGE_H_PX}px;
  margin: 0 auto;
  background: #ffffff;
  position: relative;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  box-sizing: border-box;
  padding: ${PAGE_INNER_TOP_PX}px ${PAGE_INNER_LEFT_PX}px 90px;
}
.preview-inner {
  position: relative;
  width: ${PAGE_INNER_W_PX}px;
  min-height: ${PAGE_INNER_H_PX}px;
}
.preview-flow {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 100%;
  padding-bottom: ${FOOTER_RESERVED_PX}px;
}
.preview-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  border-top: 1px solid var(--border);
  padding-top: 10px;
  font-size: 13px;
  color: var(--ink);
  text-align: center;
}
.measure-root {
  position: absolute;
  left: -10000px;
  top: 0;
  width: ${PAGE_INNER_W_PX}px;
  visibility: hidden;
  pointer-events: none;
}
strong { font-weight: 700; }
em { font-style: italic; }
blockquote {
  border-left: 3px solid var(--ink);
  background: #f9f9f9;
  padding: 10px 15px;
  font-style: italic;
}
pre {
  background: #f5f5f5;
  border: 1px solid #ddd;
  color: #333;
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
code {
  background: #f0f0f0;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 14px;
  color: #d63384;
}
ul {
  margin-left: 24px;
}
p {
  margin-bottom: 8px;
  text-align: justify;
}
@media print {
  :root {
    --preview-scale: 1;
  }
  body {
    background: #ffffff;
  }
  .contract-preview {
    padding: 0;
    overflow: visible;
  }
  .page-stack {
    gap: 0;
  }
  .preview-page-shell {
    width: auto;
    height: auto;
  }
  .contract-page {
    border: none;
    box-shadow: none;
    page-break-after: always;
  }
}
`;

// ==================== IMAGE UTILITIES ====================

async function imageUrlToBase64(url: string): Promise<string> {
  if (!url || url.startsWith("data:")) return url;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value || "");
    };

    const timer = setTimeout(() => finish(""), 10000);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";

    img.onload = () => {
      try {
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;

        if (naturalWidth <= 0 || naturalHeight <= 0) {
          finish("");
          return;
        }

        const maxWidth = 420;
        const maxHeight = 180;
        const ratio = Math.min(
          maxWidth / naturalWidth,
          maxHeight / naturalHeight,
          1,
        );
        const targetWidth = Math.max(1, Math.round(naturalWidth * ratio));
        const targetHeight = Math.max(1, Math.round(naturalHeight * ratio));

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          finish(canvas.toDataURL("image/png"));
        } else {
          finish("");
        }
      } catch {
        finish("");
      }
    };
    img.onerror = () => finish("");
    img.src = url;
  });
}

// ==================== PAGE UTILITIES ====================

function injectStyles(el: HTMLElement) {
  const s = document.createElement("style");
  s.textContent = SHARED_CSS;
  el.insertBefore(s, el.firstChild);
}

async function waitForImages(el: HTMLElement): Promise<void> {
  const imgs = el.querySelectorAll("img");
  await Promise.all(
    Array.from(imgs).map((img: HTMLImageElement) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((res) => {
        img.onload = () => res();
        img.onerror = () => res();
        setTimeout(() => res(), 8000);
      });
    }),
  );
}

async function waitForFonts(): Promise<void> {
  const fontSet = (
    document as Document & { fonts?: { ready?: Promise<unknown> } }
  ).fonts;
  if (fontSet?.ready) {
    await fontSet.ready;
  }
}

function mmToPx(mm: number): number {
  return Math.round(mm * PX_PER_MM);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface RenderContext {
  contractNumber: string;
  contractTitle: string;
  contractTitleEn: string;
  today: string;
}

interface ClauseSectionDescriptor {
  titleHtml: string;
  titleText: string;
  atoms: string[];
}

type PaginationSection =
  | { kind: "simple"; html: string; forceNewPage?: boolean }
  | (ClauseSectionDescriptor & { kind: "clause" });

interface MeasureWorkspace {
  host: HTMLDivElement;
  probe: HTMLDivElement;
  cache: Map<string, number>;
}

function getRenderContext(contract: Contract): RenderContext {
  return {
    contractNumber:
      contract.contractNumber ||
      `HD-${new Date().getFullYear()}-${String(contract.id || 1).padStart(4, "0")}`,
    contractTitle: getContractTitle(contract.contractType),
    contractTitleEn: getContractTitleEn(contract.contractType),
    today: formatDate(new Date().toISOString()),
  };
}

function getContractClausesHTML(contract: Contract): string {
  switch (contract.contractType) {
    case ContractType.PROBATION:
      return genProbClauses(contract);
    case ContractType.FULL_TIME:
      return genFullClauses(contract);
    case ContractType.PART_TIME:
      return genPartClauses(contract);
    default:
      return genFullClauses(contract);
  }
}

function buildSignatureSectionHTML(contract: Contract): string {
  const employerSignature = contract.employerSignatureUrl
    ? `<img src="${contract.employerSignatureUrl}" class="signature-img" style="max-width:180px;max-height:80px;object-fit:contain;display:block;" crossorigin="anonymous" />`
    : '<div class="signature-line" style="width:70%;height:1px;border-top:1px dashed #000;border-bottom:none;"></div>';
  const candidateSignature = contract.candidateSignatureUrl
    ? `<img src="${contract.candidateSignatureUrl}" class="signature-img" style="max-width:180px;max-height:80px;object-fit:contain;display:block;" crossorigin="anonymous" />`
    : '<div class="signature-line" style="width:70%;height:1px;border-top:1px dashed #000;border-bottom:none;"></div>';

  return `
    <section class="signature-section" style="border:1px solid #000;padding:20px;margin-top:20px;max-width:100%;page-break-inside:avoid;">
      <h3 class="signature-section-title" style="text-align:center;text-transform:uppercase;font-size:18px;font-weight:700;margin-bottom:15px;">XÁC NHẬN VÀ CHỮ KÝ CÁC BÊN</h3>
      <p class="signature-intro" style="text-align:center;font-size:15px;line-height:1.6;margin-bottom:20px;">
        Hai bên đã đọc, hiểu rõ toàn bộ nội dung hợp đồng, cam kết thực hiện đúng các điều khoản đã thỏa thuận
        và chịu trách nhiệm trước pháp luật về cam kết của mình.
      </p>
      <table class="signature-table" style="width:100%;max-width:100%;border-collapse:collapse;table-layout:fixed;">
        <thead>
          <tr>
            <th style="text-transform:uppercase;font-size:16px;font-weight:700;padding:10px;border:none;">ĐẠI DIỆN BÊN A</th>
            <th style="text-transform:uppercase;font-size:16px;font-weight:700;padding:10px;border:none;">NGƯỜI LAO ĐỘNG (BÊN B)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:10px;border:none;vertical-align:top;">
              <div class="signature-block" style="min-height:180px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;text-align:center;">
                <div class="signature-company" style="font-size:14px;color:#4a4a4a;font-style:italic;margin-bottom:10px;">${normalizeText(contract.employerCompanyName)}</div>
                <div class="signature-space" style="width:100%;height:96px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;">${employerSignature}</div>
                <div class="signature-name" style="font-size:16px;font-weight:700;">${normalizeText(contract.employerName)}</div>
                ${contract.employerSignedAt ? `<div class="signature-date" style="margin-top:6px;font-size:14px;color:#4a4a4a;">Ngày ký: ${formatDate(contract.employerSignedAt)}</div>` : ""}
              </div>
            </td>
            <td style="padding:10px;border:none;vertical-align:top;">
              <div class="signature-block" style="min-height:180px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;text-align:center;">
                <div class="signature-company" style="font-size:14px;color:#4a4a4a;font-style:italic;margin-bottom:10px;">${normalizeText(contract.candidatePosition, "Người lao động")}</div>
                <div class="signature-space" style="width:100%;height:96px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;">${candidateSignature}</div>
                <div class="signature-name" style="font-size:16px;font-weight:700;">${getCandidateDisplayName(contract)}</div>
                ${contract.candidateSignedAt ? `<div class="signature-date" style="margin-top:6px;font-size:14px;color:#4a4a4a;">Ngày ký: ${formatDate(contract.candidateSignedAt)}</div>` : ""}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="signature-note" style="margin-top:20px;text-align:center;font-size:14px;color:#4a4a4a;font-style:italic;">Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản để thực hiện.</div>
    </section>`;
}

function buildFlowBlock(innerHtml: string, className = ""): string {
  return `<section class="flow-block ${className}">${innerHtml}</section>`;
}

function buildClauseLeadBlock(titleHtml: string, atomHtml: string): string {
  return buildFlowBlock(
    `<div class="clause-copy">${titleHtml}<div class="clause-body">${atomHtml}</div></div>`,
    "clause-unit",
  );
}

function buildClauseContinuationBlock(atomHtml: string): string {
  return buildFlowBlock(
    `<div class="clause-fragment">${atomHtml}</div>`,
    "clause-fragment-unit",
  );
}

function buildPageHTML(
  blocks: string[],
  pageNum: number,
  totalPages: number,
  context: RenderContext,
  options?: ContractHTMLOptions,
  preview = false,
): string {
  const articleStyle = [
    `width:${PAGE_W_PX}px`,
    `height:${PAGE_H_PX}px`,
    "background:#ffffff",
    "position:relative",
    "overflow:hidden",
    preview ? "box-shadow:0 10px 30px rgba(0,0,0,0.1)" : "",
  ]
    .filter(Boolean)
    .join(";");

  const pageInnerStyle = [
    "position:absolute",
    `top:${PAGE_INNER_TOP_PX}px`,
    `left:${PAGE_INNER_LEFT_PX}px`,
    `width:${PAGE_INNER_W_PX}px`,
    `height:${PAGE_INNER_H_PX}px`,
    "overflow:visible",
  ].join(";");

  const pageContentStyle = [
    "display:flex",
    "flex-direction:column",
    "gap:15px",
    "max-width:100%",
    `padding-bottom:${FOOTER_RESERVED_PX}px`,
  ].join(";");

  const pageFooterStyle = [
    "position:absolute",
    "left:0",
    "bottom:0",
    "width:100%",
    "border-top:1px solid #000",
    "padding-top:8px",
    "padding-bottom:4px",
    "font-size:13px",
    "line-height:1.35",
    "color:#000",
  ].join(";");

  const watermark = options?.showWatermark
    ? `<div class="page-watermark">${options.showWatermark}</div>`
    : "";

  return `
    <article class="contract-page ${preview ? "contract-page--preview" : ""}" style="${articleStyle}">
      ${watermark}
      <div class="page-inner" style="${pageInnerStyle}">
        <div class="page-content" style="${pageContentStyle}">
          ${blocks.join("")}
        </div>
        <footer class="page-footer" style="${pageFooterStyle}">
          <table class="page-footer__table" style="width:100%;border-collapse:collapse;table-layout:fixed;">
            <tbody>
              <tr>
                <td class="page-footer__left" style="text-align:left;width:33.333%;vertical-align:middle;padding-right:6px;overflow-wrap:anywhere;word-break:break-word;">${context.contractTitle}</td>
                <td class="page-footer__center" style="text-align:center;width:33.333%;vertical-align:middle;padding:0 4px;font-style:italic;overflow-wrap:anywhere;word-break:break-word;">Số: ${context.contractNumber}</td>
                <td class="page-footer__right" style="text-align:right;width:33.333%;vertical-align:middle;padding-left:6px;overflow-wrap:anywhere;word-break:break-word;">Trang ${pageNum}/${totalPages}</td>
              </tr>
            </tbody>
          </table>
        </footer>
      </div>
    </article>`;
}

function parseClauseSections(clauseHtml: string): ClauseSectionDescriptor[] {
  if (typeof document === "undefined") {
    return [
      {
        titleHtml: '<h3 class="clause-title">Điều khoản hợp đồng</h3>',
        titleText: "Điều khoản hợp đồng",
        atoms: [clauseHtml],
      },
    ];
  }

  const container = document.createElement("div");
  container.innerHTML = clauseHtml;

  const sections: ClauseSectionDescriptor[] = [];
  let currentSection: ClauseSectionDescriptor | null = null;

  Array.from(container.children).forEach((element) => {
    const el = element as HTMLElement;

    if (el.classList.contains("clause-title")) {
      if (currentSection) {
        sections.push(currentSection);
      }

      currentSection = {
        titleHtml: el.outerHTML,
        titleText: el.textContent?.trim() || "Điều khoản hợp đồng",
        atoms: [],
      };
      return;
    }

    if (!currentSection) {
      currentSection = {
        titleHtml: '<h3 class="clause-title">Điều khoản hợp đồng</h3>',
        titleText: "Điều khoản hợp đồng",
        atoms: [],
      };
    }

    currentSection.atoms.push(...atomizeClauseNode(el));
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

function atomizeClauseNode(el: HTMLElement): string[] {
  if (el.tagName === "UL" && el.classList.contains("clause-list")) {
    return Array.from(el.children)
      .filter((child) => child.tagName === "LI")
      .map(
        (li) =>
          `<ul class="clause-list clause-list--fragment"><li>${(li as HTMLElement).innerHTML}</li></ul>`,
      );
  }

  if (el.classList.contains("clause-sub")) {
    const compoundBlocks = splitCompoundClauseSub(el);
    if (compoundBlocks.length > 1) {
      return compoundBlocks;
    }
  }

  return [el.outerHTML];
}

function splitCompoundClauseSub(el: HTMLElement): string[] {
  const blockTags = new Set([
    "P",
    "UL",
    "OL",
    "TABLE",
    "BLOCKQUOTE",
    "PRE",
    "DIV",
    "H4",
    "H5",
    "HR",
  ]);
  const directChildren = Array.from(el.children);

  if (directChildren.length <= 1) {
    return [el.outerHTML];
  }

  const firstBlockIndex = Array.from(el.childNodes).findIndex(
    (node) =>
      node.nodeType === Node.ELEMENT_NODE &&
      blockTags.has((node as HTMLElement).tagName),
  );

  if (firstBlockIndex === -1) {
    return [el.outerHTML];
  }

  const prefixNodes = Array.from(el.childNodes).slice(0, firstBlockIndex);
  const prefixHtml = prefixNodes
    .map((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || "";
      }
      return (node as HTMLElement).outerHTML;
    })
    .join("")
    .trim();

  const blockChildren = directChildren.filter((child) =>
    blockTags.has(child.tagName),
  );
  if (blockChildren.length <= 1) {
    return [el.outerHTML];
  }

  return blockChildren.map(
    (child, index) => `
    <div class="clause-sub">
      ${index === 0 && prefixHtml ? prefixHtml : ""}
      ${child.outerHTML}
    </div>
  `,
  );
}

function chunkText(text: string, maxLength = 500): string[] {
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) return [];
  if (cleanText.length <= maxLength) return [cleanText];

  const sentences = cleanText.split(/(?<=[.!?;:])\s+/u);
  const chunks: string[] = [];
  let current = "";

  sentences.forEach((sentence) => {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length > maxLength && current) {
      chunks.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  });

  if (current) {
    chunks.push(current);
  }

  return chunks.length ? chunks : [cleanText];
}

function splitOversizedAtomHtml(html: string): string[] {
  if (typeof document === "undefined") {
    return [html];
  }

  const container = document.createElement("div");
  container.innerHTML = html.trim();
  const element = container.firstElementChild as HTMLElement | null;

  if (!element) return [html];

  if (element.tagName === "UL") {
    const items = Array.from(element.children).filter(
      (child) => child.tagName === "LI",
    );
    if (items.length > 1) {
      return items.map(
        (li) =>
          `<ul class="${element.className || "clause-list clause-list--fragment"}"><li>${(li as HTMLElement).innerHTML}</li></ul>`,
      );
    }
  }

  if (element.classList.contains("clause-sub")) {
    const compound = splitCompoundClauseSub(element);
    if (compound.length > 1) {
      return compound;
    }
  }

  const textContent = element.textContent?.replace(/\s+/g, " ").trim() || "";
  if (textContent.length < 220) {
    return [html];
  }

  const chunks = chunkText(textContent, 220);
  if (chunks.length <= 1) {
    return [html];
  }

  if (element.tagName === "P") {
    return chunks.map(
      (chunk) => `<p class="clause-text">${escapeHtml(chunk)}</p>`,
    );
  }

  if (element.classList.contains("clause-sub")) {
    return chunks.map(
      (chunk) =>
        `<div class="clause-sub"><p class="clause-text">${escapeHtml(chunk)}</p></div>`,
    );
  }

  if (element.tagName === "BLOCKQUOTE") {
    return chunks.map(
      (chunk) => `<blockquote>${escapeHtml(chunk)}</blockquote>`,
    );
  }

  return [html];
}

function createMeasureWorkspace(): MeasureWorkspace {
  const host = document.createElement("div");
  host.className = "measure-root";
  injectStyles(host);

  const probe = document.createElement("div");
  probe.className = "page-content";
  host.appendChild(probe);
  document.body.appendChild(host);

  return {
    host,
    probe,
    cache: new Map<string, number>(),
  };
}

async function measureBlockHeight(
  workspace: MeasureWorkspace,
  html: string,
): Promise<number> {
  const cached = workspace.cache.get(html);
  if (cached !== undefined) return cached;

  workspace.probe.innerHTML = html;
  await waitForImages(workspace.probe);
  const element = workspace.probe.firstElementChild as HTMLElement | null;
  const height = element?.offsetHeight || 0;
  workspace.cache.set(html, height);
  return height;
}

function destroyMeasureWorkspace(workspace: MeasureWorkspace): void {
  if (workspace.host.parentNode) {
    workspace.host.parentNode.removeChild(workspace.host);
  }
}

function buildPaginationSections(
  contract: Contract,
  context: RenderContext,
): PaginationSection[] {
  const clauseSections = parseClauseSections(
    getContractClausesHTML(contract),
  ).map((section) => ({
    kind: "clause" as const,
    ...section,
  }));

  return [
    {
      kind: "simple",
      html: buildFlowBlock(
        buildContractHeaderHTML(
          context.contractNumber,
          context.today,
          context.contractTitle,
          context.contractTitleEn,
        ),
        "hero-flow",
      ),
    },
    {
      kind: "simple",
      html: buildFlowBlock(buildPartiesTableHTML(contract), "party-flow"),
    },
    {
      kind: "simple",
      html: buildFlowBlock(buildOverviewTableHTML(contract), "summary-flow"),
    },
    {
      kind: "simple",
      html: buildFlowBlock(buildContractIntroHTML(contract), "intro-flow"),
    },
    {
      kind: "simple",
      html: buildFlowBlock(buildSalaryBoxHTML(contract), "salary-flow"),
    },
    ...clauseSections,
    {
      kind: "simple",
      html: buildFlowBlock(
        buildSignatureSectionHTML(contract),
        "signature-flow",
      ),
      forceNewPage: true,
    },
  ];
}

function ensureSignaturePage(
  pages: string[][],
  contract: Contract,
): string[][] {
  const hasSignatureBlock = pages.some((page) =>
    page.some((block) => block.includes("signature-section")),
  );

  if (hasSignatureBlock) {
    return pages;
  }

  return [
    ...pages,
    [buildFlowBlock(buildSignatureSectionHTML(contract), "signature-flow")],
  ];
}

function createSignatureFallbackCanvas(
  contract: Contract,
  context: RenderContext,
  pageNum: number,
  totalPages: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_W_PX;
  canvas.height = PAGE_H_PX;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }

  const drawWrappedText = (
    text: string,
    x: number,
    startY: number,
    maxWidth: number,
    lineHeight: number,
    align: CanvasTextAlign,
  ): number => {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (!normalized) {
      return startY;
    }

    const words = normalized.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    ctx.textAlign = align;
    lines.forEach((line, index) => {
      ctx.fillText(line, x, startY + index * lineHeight);
    });

    return startY + lines.length * lineHeight;
  };

  const innerX = PAGE_INNER_LEFT_PX;
  const innerY = PAGE_INNER_TOP_PX;
  const innerW = PAGE_INNER_W_PX;
  const innerH = PAGE_INNER_H_PX;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const boxX = innerX;
  const boxY = innerY + 18;
  const boxW = innerW;
  const boxH = 430;

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  const centerX = boxX + boxW / 2;

  ctx.fillStyle = "#000000";
  ctx.font = "700 18px 'Times New Roman', Times, serif";
  ctx.textAlign = "center";
  ctx.fillText("XÁC NHẬN VÀ CHỮ KÝ CÁC BÊN", centerX, boxY + 36);

  ctx.font = "15px 'Times New Roman', Times, serif";
  const introBottom = drawWrappedText(
    "Hai bên đã đọc, hiểu rõ toàn bộ nội dung hợp đồng, cam kết thực hiện đúng các điều khoản đã thỏa thuận và chịu trách nhiệm trước pháp luật về cam kết của mình.",
    centerX,
    boxY + 66,
    boxW - 44,
    24,
    "center",
  );

  const colGap = 34;
  const colW = (boxW - 48 - colGap) / 2;
  const leftColX = boxX + 24;
  const rightColX = leftColX + colW + colGap;
  const colTopY = introBottom + 14;

  ctx.font = "700 16px 'Times New Roman', Times, serif";
  ctx.textAlign = "center";
  ctx.fillText("ĐẠI DIỆN BÊN A", leftColX + colW / 2, colTopY);
  ctx.fillText("NGƯỜI LAO ĐỘNG (BÊN B)", rightColX + colW / 2, colTopY);

  ctx.font = "italic 14px 'Times New Roman', Times, serif";
  drawWrappedText(
    normalizeText(contract.employerCompanyName),
    leftColX + colW / 2,
    colTopY + 28,
    colW - 16,
    20,
    "center",
  );
  drawWrappedText(
    normalizeText(contract.candidatePosition, "Người lao động"),
    rightColX + colW / 2,
    colTopY + 28,
    colW - 16,
    20,
    "center",
  );

  const signatureLineY = colTopY + 108;
  ctx.save();
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(leftColX + colW * 0.14, signatureLineY);
  ctx.lineTo(leftColX + colW * 0.86, signatureLineY);
  ctx.moveTo(rightColX + colW * 0.14, signatureLineY);
  ctx.lineTo(rightColX + colW * 0.86, signatureLineY);
  ctx.stroke();
  ctx.restore();

  ctx.font = "700 16px 'Times New Roman', Times, serif";
  ctx.fillText(
    normalizeText(contract.employerName),
    leftColX + colW / 2,
    signatureLineY + 42,
  );
  ctx.fillText(
    getCandidateDisplayName(contract),
    rightColX + colW / 2,
    signatureLineY + 42,
  );

  ctx.font = "14px 'Times New Roman', Times, serif";
  if (contract.employerSignedAt) {
    ctx.fillText(
      `Ngày ký: ${formatDate(contract.employerSignedAt)}`,
      leftColX + colW / 2,
      signatureLineY + 68,
    );
  }
  if (contract.candidateSignedAt) {
    ctx.fillText(
      `Ngày ký: ${formatDate(contract.candidateSignedAt)}`,
      rightColX + colW / 2,
      signatureLineY + 68,
    );
  }

  ctx.font = "italic 14px 'Times New Roman', Times, serif";
  drawWrappedText(
    "Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản để thực hiện.",
    centerX,
    boxY + boxH - 24,
    boxW - 38,
    18,
    "center",
  );

  const footerLineY = innerY + innerH - 34;
  ctx.strokeStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(innerX, footerLineY);
  ctx.lineTo(innerX + innerW, footerLineY);
  ctx.stroke();

  const footerY = footerLineY + 24;
  ctx.font = "15px 'Times New Roman', Times, serif";
  ctx.textAlign = "left";
  ctx.fillText(context.contractTitle, innerX, footerY);
  ctx.textAlign = "center";
  ctx.font = "italic 15px 'Times New Roman', Times, serif";
  ctx.fillText(`Số: ${context.contractNumber}`, innerX + innerW / 2, footerY);
  ctx.textAlign = "right";
  ctx.font = "15px 'Times New Roman', Times, serif";
  ctx.fillText(`Trang ${pageNum}/${totalPages}`, innerX + innerW, footerY);

  return canvas;
}

async function paginateContract(
  contract: Contract,
  context: RenderContext,
): Promise<string[][]> {
  const sections = buildPaginationSections(contract, context);
  const pages: string[][] = [[]];
  const workspace = createMeasureWorkspace();
  const pageLimitPx = PAGE_CONTENT_H_PX;
  const gapPx = mmToPx(BLOCK_GAP_MM);
  let currentHeight = 0;

  const currentPage = () => pages[pages.length - 1];
  const isCurrentPageEmpty = () => currentPage().length === 0;
  const startNewPage = () => {
    if (!isCurrentPageEmpty()) {
      pages.push([]);
      currentHeight = 0;
    }
  };
  const additionalHeight = (blockHeight: number) =>
    isCurrentPageEmpty() ? blockHeight : blockHeight + gapPx;
  const canFit = (blockHeight: number) =>
    currentHeight + additionalHeight(blockHeight) <= pageLimitPx;
  const commit = (html: string, blockHeight: number) => {
    const pageWasEmpty = isCurrentPageEmpty();
    currentPage().push(html);
    currentHeight += pageWasEmpty ? blockHeight : blockHeight + gapPx;
  };

  await waitForFonts();

  for (const section of sections) {
    if (section.kind === "simple") {
      const pendingBlocks = [section.html];

      if (section.forceNewPage) {
        startNewPage();
      }

      while (pendingBlocks.length > 0) {
        const block = pendingBlocks.shift() as string;
        let height = await measureBlockHeight(workspace, block);

        if (height > pageLimitPx && isCurrentPageEmpty()) {
          commit(block, height);
          continue;
        }

        if (!canFit(height) && !isCurrentPageEmpty()) {
          startNewPage();
          height = await measureBlockHeight(workspace, block);
        }

        commit(block, height);
      }

      continue;
    }

    let atomIndex = 0;
    let isContinuation = false;

    while (atomIndex < section.atoms.length) {
      let atomHtml = section.atoms[atomIndex];
      const clauseHeading = isContinuation
        ? `<h3 class="clause-title clause-title--continued">${section.titleText} (tiếp theo)</h3>`
        : section.titleHtml;
      const leadBlock = buildClauseLeadBlock(clauseHeading, atomHtml);
      let leadHeight = await measureBlockHeight(workspace, leadBlock);

      if (leadHeight > pageLimitPx) {
        const splitAtoms = splitOversizedAtomHtml(atomHtml);
        if (splitAtoms.length > 1) {
          section.atoms.splice(atomIndex, 1, ...splitAtoms);
          continue;
        }
      }

      if (!canFit(leadHeight) && !isCurrentPageEmpty()) {
        const splitAtoms = splitOversizedAtomHtml(atomHtml);
        if (splitAtoms.length > 1) {
          section.atoms.splice(atomIndex, 1, ...splitAtoms);
          continue;
        }

        startNewPage();
        leadHeight = await measureBlockHeight(workspace, leadBlock);
      }

      commit(leadBlock, leadHeight);
      atomIndex += 1;
      isContinuation = true;

      while (atomIndex < section.atoms.length) {
        atomHtml = section.atoms[atomIndex];
        const bodyBlock = buildClauseContinuationBlock(atomHtml);
        const bodyHeight = await measureBlockHeight(workspace, bodyBlock);

        if (bodyHeight > pageLimitPx) {
          const splitAtoms = splitOversizedAtomHtml(atomHtml);
          if (splitAtoms.length > 1) {
            section.atoms.splice(atomIndex, 1, ...splitAtoms);
            continue;
          }
        }

        if (!canFit(bodyHeight)) {
          const splitAtoms = splitOversizedAtomHtml(atomHtml);
          if (splitAtoms.length > 1) {
            section.atoms.splice(atomIndex, 1, ...splitAtoms);
            continue;
          }

          startNewPage();
          break;
        }

        commit(bodyBlock, bodyHeight);
        atomIndex += 1;
      }
    }
  }

  destroyMeasureWorkspace(workspace);
  return pages.filter((page) => page.length > 0);
}

async function renderPageToCanvas(
  pageHtml: string,
  scale: number,
): Promise<HTMLCanvasElement> {
  const sanitizeCanvasElements = (root: HTMLElement) => {
    const canvases = Array.from(root.querySelectorAll("canvas"));

    canvases.forEach((node) => {
      const canvas = node as HTMLCanvasElement;
      const width = canvas.width || canvas.clientWidth;
      const height = canvas.height || canvas.clientHeight;

      if (width <= 0 || height <= 0) {
        canvas.remove();
        return;
      }

      try {
        const image = document.createElement("img");
        image.src = canvas.toDataURL("image/png");
        image.style.width = `${canvas.clientWidth || width}px`;
        image.style.height = `${canvas.clientHeight || height}px`;
        image.style.display = "block";
        canvas.replaceWith(image);
      } catch {
        // Keep original canvas when conversion is not possible.
      }
    });
  };

  const host = document.createElement("div");
  host.style.cssText =
    `position:fixed;left:-10000px;top:0;width:${PAGE_W_PX}px;height:${PAGE_H_PX}px;overflow:hidden;background:#ffffff;`;
  injectStyles(host);
  host.insertAdjacentHTML("beforeend", pageHtml);
  document.body.appendChild(host);

  try {
    await waitForFonts();
    await waitForImages(host);
    const page = host.querySelector(".contract-page") as HTMLElement | null;
    if (!page) {
      throw new Error("Không thể dựng trang hợp đồng.");
    }

    const isCanvasLikelyBlank = (canvas: HTMLCanvasElement): boolean => {
      if (!canvas.width || !canvas.height) {
        return true;
      }

      const sample = document.createElement("canvas");
      const sampleWidth = 80;
      const sampleHeight = 120;
      sample.width = sampleWidth;
      sample.height = sampleHeight;

      const sampleCtx = sample.getContext("2d", {
        willReadFrequently: true,
      });
      if (!sampleCtx) {
        return false;
      }

      sampleCtx.fillStyle = "#ffffff";
      sampleCtx.fillRect(0, 0, sampleWidth, sampleHeight);
      sampleCtx.drawImage(canvas, 0, 0, sampleWidth, sampleHeight);

      const pixels = sampleCtx.getImageData(0, 0, sampleWidth, sampleHeight)
        .data;
      let inkPixels = 0;

      for (let idx = 0; idx < pixels.length; idx += 4) {
        const alpha = pixels[idx + 3];
        if (alpha < 5) continue;

        const red = pixels[idx];
        const green = pixels[idx + 1];
        const blue = pixels[idx + 2];
        if (red < 246 || green < 246 || blue < 246) {
          inkPixels += 1;
          if (inkPixels > 6) {
            return false;
          }
        }
      }

      return true;
    };

    // Keep the signature page render-safe: external image URLs can blank a page in html2canvas.
    const signatureImages = Array.from(
      page.querySelectorAll("img.signature-img"),
    ) as HTMLImageElement[];
    signatureImages.forEach((img) => {
      const src = (img.getAttribute("src") || "").trim();
      if (!src.startsWith("data:image/")) {
        const fallback = document.createElement("div");
        fallback.className = "signature-line";
        fallback.style.width = "70%";
        fallback.style.height = "1px";
        fallback.style.borderTop = "1px dashed #000";
        fallback.style.borderBottom = "none";
        img.replaceWith(fallback);
      }
    });

    sanitizeCanvasElements(page);

    const baseOptions = {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      width: PAGE_W_PX,
      height: PAGE_H_PX,
      windowWidth: PAGE_W_PX,
      windowHeight: PAGE_H_PX,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
    };

    const renderWithMode = (foreignObjectRendering: boolean) =>
      html2canvas(
        page,
        foreignObjectRendering
          ? {
              ...baseOptions,
              foreignObjectRendering: true,
            }
          : baseOptions,
      );

    const shouldHaveVisibleContent =
      (page.textContent || "").replace(/\s+/g, "").length > 0;

    let canvas: HTMLCanvasElement;

    try {
      canvas = await renderWithMode(false);
    } catch {
      canvas = await renderWithMode(true);
    }

    if (shouldHaveVisibleContent && isCanvasLikelyBlank(canvas)) {
      canvas = await renderWithMode(true);
      if (isCanvasLikelyBlank(canvas)) {
        throw new Error("Không thể kết xuất nội dung trang hợp đồng (canvas trắng).");
      }
    }

    return canvas;
  } finally {
    if (host.parentNode) {
      host.parentNode.removeChild(host);
    }
  }
}

// ==================== PDF GENERATOR (paginated A4 pages) ====================

export async function generateContractPDF(
  contract: Contract,
  options: ContractHTMLOptions = {},
): Promise<Blob> {
  const opts = { ...defaultOptions, ...options };
  const scale = opts.scale ?? 1.0;
  const imageType = opts.imageType ?? "PNG";
  const imageQuality = Math.min(1, Math.max(0.4, opts.imageQuality ?? 1.0));
  const pdfImageCompression = opts.pdfImageCompression ?? "MEDIUM";
  const c: Contract = { ...contract };

  const isDataImageUrl = (value?: string) =>
    !!value && /^data:image\/[a-zA-Z0-9.+-]+;base64,/u.test(value);

  if (contract.employerSignatureUrl) {
    const employerSignatureDataUrl = await imageUrlToBase64(
      contract.employerSignatureUrl,
    );
    c.employerSignatureUrl = isDataImageUrl(employerSignatureDataUrl)
      ? employerSignatureDataUrl
      : "";
  }
  if (contract.candidateSignatureUrl) {
    const candidateSignatureDataUrl = await imageUrlToBase64(
      contract.candidateSignatureUrl,
    );
    c.candidateSignatureUrl = isDataImageUrl(candidateSignatureDataUrl)
      ? candidateSignatureDataUrl
      : "";
  }

  const context = getRenderContext(c);
  const pageBlocks = ensureSignaturePage(await paginateContract(c, context), c);
  const totalPages = pageBlocks.length;
  const pageHtmls = pageBlocks.map((blocks, index) =>
    buildPageHTML(blocks, index + 1, totalPages, context, options, false),
  );

  if (pageHtmls.length === 0) {
    throw new Error("Không thể tạo nội dung PDF hợp đồng.");
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  for (let index = 0; index < pageHtmls.length; index += 1) {
    const pageHtml = pageHtmls[index];
    const pageNum = index + 1;
    const isSignaturePage = pageHtml.includes("signature-section");

    let canvas: HTMLCanvasElement;
    try {
      canvas = await renderPageToCanvas(pageHtml, scale);
    } catch (error) {
      if (!isSignaturePage) {
        throw error;
      }

      canvas = createSignatureFallbackCanvas(c, context, pageNum, totalPages);
    }

    if (index > 0) {
      pdf.addPage();
    }

    let imageData = "";
    let imageFormat: "PNG" | "JPEG" = imageType;
    try {
      imageData =
        imageType === "JPEG"
          ? canvas.toDataURL("image/jpeg", imageQuality)
          : canvas.toDataURL("image/png");
    } catch {
      imageData = canvas.toDataURL("image/jpeg", imageQuality);
      imageFormat = "JPEG";
    }

    if (!imageData || !imageData.startsWith("data:image/")) {
      throw new Error(`Không thể kết xuất dữ liệu ảnh trang ${index + 1}.`);
    }

    if (/^data:image\/jpeg;/i.test(imageData)) {
      imageFormat = "JPEG";
    }
    if (/^data:image\/png;/i.test(imageData)) {
      imageFormat = "PNG";
    }

    const pageWidth = pdf.internal.pageSize.getWidth() || PAGE_W;
    const pageHeight = pdf.internal.pageSize.getHeight() || PAGE_H;

    pdf.addImage(
      imageData,
      imageFormat,
      0,
      0,
      pageWidth,
      pageHeight,
      undefined,
      pdfImageCompression,
    );
  }

  return pdf.output("blob");
}

// ==================== STANDALONE HTML GENERATOR (for preview) ====================
// Uses the SAME paginated page structure as generateContractPDF
// so preview and downloaded PDF are visually identical.

export async function generateContractHTML(
  contract: Contract,
  options?: ContractHTMLOptions,
): Promise<string> {
  const context = getRenderContext(contract);
  const pageBlocks = ensureSignaturePage(
    await paginateContract(contract, context),
    contract,
  );
  const totalPages = pageBlocks.length;

  const pageHtmls = pageBlocks.map((blocks, index) =>
    buildPageHTML(blocks, index + 1, totalPages, context, options, true),
  );
  const previewPages = pageHtmls
    .map((pageHtml) => `<div class="preview-page-shell">${pageHtml}</div>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
${SHARED_CSS}
  </style>
</head>
<body>
<div class="contract-preview">
  <div class="page-stack">
    ${previewPages}
  </div>
</div>
<script>
  (function () {
    var pageWidth = ${PAGE_W_PX};
    var gutter = 20;

    function updatePreviewScale() {
      var viewportWidth =
        document.documentElement.clientWidth || window.innerWidth || pageWidth;
      var availableWidth = Math.max(320, viewportWidth - gutter);
      var scale = Math.min(1, availableWidth / pageWidth);
      document.documentElement.style.setProperty(
        "--preview-scale",
        scale.toFixed(4),
      );
    }

    updatePreviewScale();
    window.addEventListener("resize", updatePreviewScale, { passive: true });
  })();
</script>
</body>
</html>`;
}

export async function downloadContractPDF(
  contract: Contract,
  filename?: string,
): Promise<void> {
  const blob = await generateContractPDF(contract);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    filename ||
    `hop-dong-${contract.contractNumber || contract.id || "download"}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default {
  generateContractHTML,
  generateContractPDF,
  downloadContractPDF,
};
