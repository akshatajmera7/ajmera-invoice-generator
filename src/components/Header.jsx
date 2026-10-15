import React from 'react';
import { Download, Share2, RotateCcw } from 'lucide-react';

export default function Header({ onDownloadPdf, onSharePdf, onReset, isProcessing, processAction }) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="header-logo-container">
          <img src="/logo.png" alt="House of Ajmera Logo" className="header-logo" />
        </div>
        <div className="header-title-block">
          <h1 className="header-company">RAMSWAROOP NIRMAL KUMAR AJMERA</h1>
          <p className="header-subtitle">Official GST Tax Invoice (2.5% CGST + 2.5% SGST)</p>
        </div>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="btn btn-secondary header-btn"
          onClick={onReset}
          title="Reset all fields"
        >
          <RotateCcw size={15} />
          <span className="btn-label-desktop">Reset</span>
        </button>

        <button
          type="button"
          className="btn btn-share header-btn"
          onClick={onSharePdf}
          disabled={isProcessing}
          title="Share PDF directly via WhatsApp, Mail, Telegram, etc."
        >
          {isProcessing && processAction === 'share' ? (
            <>
              <div className="spinner"></div>
              <span>Preparing...</span>
            </>
          ) : (
            <>
              <Share2 size={15} />
              <span>Share PDF</span>
            </>
          )}
        </button>

        <button
          type="button"
          className="btn btn-primary header-btn"
          onClick={onDownloadPdf}
          disabled={isProcessing}
          title="Download PDF file"
        >
          {isProcessing && processAction === 'download' ? (
            <>
              <div className="spinner"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Download size={15} />
              <span>Download PDF</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
