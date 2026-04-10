import React, { useState, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";
import { Contract } from "../../types/contract";
import {
  generateContractHTML,
  downloadContractPDF,
} from "./ContractHTMLGenerator";
import "./ContractPDFViewer.css";

interface ContractPDFViewerProps {
  contract: Contract;
}

const ContractPDFViewer: React.FC<ContractPDFViewerProps> = ({ contract }) => {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsGenerating(true);
    setError(null);

    generateContractHTML(contract)
      .then((html) => {
        if (!cancelled) setHtmlContent(html);
      })
      .catch(() => {
        if (!cancelled) setError("Không thể tạo bản xem trước.");
      })
      .finally(() => {
        if (!cancelled) setIsGenerating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [contract]);

  const handleDownload = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      await downloadContractPDF(
        contract,
        `hop-dong-${contract.contractNumber || contract.id || "download"}.pdf`,
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể tải PDF.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="cpv-wrapper">
      <div className="cpv-header">
        <span className="cpv-label">Hợp đồng</span>
        <div className="cpv-actions">
          <button
            type="button"
            className="cpv-btn"
            onClick={handleDownload}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="cpv-spin" />
              </>
            ) : (
              <Download size={14} />
            )}
            Tải PDF
          </button>
        </div>
      </div>

      {error && <div className="cpv-error">{error}</div>}

      <div className="cpv-preview">
        {isGenerating && !htmlContent ? (
          <div className="cpv-generating">
            <Loader2 size={24} className="cpv-spin" />
            <span>Đang tạo bản xem trước...</span>
          </div>
        ) : htmlContent ? (
          <iframe
            srcDoc={htmlContent}
            title="Contract Preview"
            className="cpv-iframe"
          />
        ) : null}
      </div>
    </div>
  );
};

export default ContractPDFViewer;
