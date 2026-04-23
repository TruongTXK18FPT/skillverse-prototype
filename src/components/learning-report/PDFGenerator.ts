import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { StudentLearningReportResponse } from "../../services/learningReportService";

export interface PDFGeneratorOptions {
  filename?: string;
  includeHeader?: boolean;
  includeFooter?: boolean;
  includePageNumbers?: boolean;
  quality?: "low" | "medium" | "high";
  userAvatar?: string;
  branding?: {
    logo?: string;
    companyName?: string;
    tagline?: string;
  };
}

const defaultOptions: PDFGeneratorOptions = {
  filename: "learning-report",
  includeHeader: true,
  includeFooter: true,
  includePageNumbers: true,
  quality: "high",
};

export async function generateLearningReportPDF(
  report: StudentLearningReportResponse,
  options: PDFGeneratorOptions = {},
): Promise<Blob> {
  const { generatePDFFromHTML } = await import("./HTMLPDFGenerator");
  return generatePDFFromHTML(report, {
    filename: options.filename,
    quality:
      options.quality === "low"
        ? 0.78
        : options.quality === "medium"
          ? 0.88
          : 0.95,
    scale:
      options.quality === "low"
        ? 1.2
        : options.quality === "medium"
          ? 1.6
          : 2,
    userAvatar: options.userAvatar,
  });
}

export async function downloadLearningReportPDF(
  report: StudentLearningReportResponse,
  options: PDFGeneratorOptions = {},
): Promise<void> {
  const merged = { ...defaultOptions, ...options };
  const { downloadVietnamesePDF } = await import("./HTMLPDFGenerator");
  await downloadVietnamesePDF(report, {
    filename: merged.filename,
    quality:
      merged.quality === "low"
        ? 0.78
        : merged.quality === "medium"
          ? 0.88
          : 0.95,
    scale:
      merged.quality === "low"
        ? 1.2
        : merged.quality === "medium"
          ? 1.6
          : 2,
    userAvatar: merged.userAvatar,
  });
}

export async function generatePDFFromElement(
  element: HTMLElement,
  filename: string = "learning-report",
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL("image/png");

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${filename}.pdf`);
}

export default {
  generateLearningReportPDF,
  downloadLearningReportPDF,
  generatePDFFromElement,
};
