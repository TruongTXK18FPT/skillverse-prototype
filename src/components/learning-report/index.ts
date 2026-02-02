// Learning Report Components - Barrel Export
export { default as LearningReportModal } from "./LearningReportModal";
export { default as LearningReportHistory } from "./LearningReportHistory";
export { default as MarkdownRenderer } from "./MarkdownRenderer";

// PDF Generation utilities
export {
  generateLearningReportPDF,
  downloadLearningReportPDF,
  generatePDFFromElement,
} from "./PDFGenerator";

// HTML-based PDF generation with full Vietnamese support
export {
  generatePDFFromHTML,
  downloadVietnamesePDF,
  generateReportHTML,
  markdownToHTML,
} from "./HTMLPDFGenerator";

// Vietnamese Font utilities
export {
  normalizeVietnamese,
  containsVietnamese,
  markdownToPlainText,
  parseMarkdownSections,
} from "./fonts/VietnameseFont";
