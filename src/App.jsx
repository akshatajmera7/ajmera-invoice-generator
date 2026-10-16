import React, { useState, useRef } from 'react';
import Header from './components/Header';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import { getTodayDateInput, formatCurrency, formatDateToIndian, isOutOfRajasthan } from './utils/formatters';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  FileText,
  Eye,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  X,
  MessageCircle,
  Mail,
  Copy,
  Check
} from 'lucide-react';

const STARTING_BILL_NUMBER = 19;

const getNextBillNumber = () => {
  try {
    const stored = localStorage.getItem('ajmera_last_bill_number');
    return stored ? parseInt(stored, 10) + 1 : STARTING_BILL_NUMBER;
  } catch {
    return STARTING_BILL_NUMBER;
  }
};

const DEFAULT_INVOICE_DATA = {
  invoiceDate: getTodayDateInput(),
  billNumber: STARTING_BILL_NUMBER,
  taxType: 'intra_state', // 'intra_state' (Rajasthan) | 'inter_state' (Out of Rajasthan)
  placeOfSupply: 'Rajasthan',
  customer: {
    name: '',
    address: '',
    city: '',
    state: 'Rajasthan',
    zipCode: '',
    gstin: '',
    contact: '',
  },
  items: [
    {
      id: 'item-1',
      name: '',
      quantity: 1,
      unit: 'Pcs',
      price: '',
    },
  ],
  bankDetails: {
    bankName: 'STATE BANK OF INDIA, BANERA',
    accountNo: '37146612448',
    ifscCode: 'SBIN0031097',
    accountHolder: 'RAMSWAROOP NIRMAL KUMAR AJMERA',
    phonePe: '9414255366',
  },
};

export default function App() {
  const [invoiceData, setInvoiceData] = useState(() => {
    try {
      const saved = localStorage.getItem('ajmera_invoice_draft_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          billNumber: parsed.billNumber ?? getNextBillNumber(),
          bankDetails: {
            ...DEFAULT_INVOICE_DATA.bankDetails,
            ...(parsed.bankDetails || {}),
          },
        };
      }
    } catch {
      // ignore
    }
    return { ...DEFAULT_INVOICE_DATA, billNumber: getNextBillNumber() };
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processAction, setProcessAction] = useState(null); // 'download' | 'share'
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'
  const [mobileFitToScreen, setMobileFitToScreen] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const invoiceSheetRef = useRef(null);

  // Sync to localStorage
  const saveState = (newData) => {
    setInvoiceData(newData);
    try {
      localStorage.setItem('ajmera_invoice_draft_v3', JSON.stringify(newData));
    } catch {
      // ignore
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpdateInvoice = (field, value) => {
    saveState({
      ...invoiceData,
      [field]: value,
    });
  };

  const handleUpdateCustomer = (field, value) => {
    saveState({
      ...invoiceData,
      customer: {
        ...invoiceData.customer,
        [field]: value,
      },
    });
  };

  const handleUpdateBank = (field, value) => {
    saveState({
      ...invoiceData,
      bankDetails: {
        ...invoiceData.bankDetails,
        [field]: value,
      },
    });
  };

  const handleAddItem = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      name: '',
      quantity: 1,
      unit: 'Pcs',
      price: '',
    };
    saveState({
      ...invoiceData,
      items: [...invoiceData.items, newItem],
    });
  };

  const handleRemoveItem = (id) => {
    if (invoiceData.items.length <= 1) return;
    saveState({
      ...invoiceData,
      items: invoiceData.items.filter((item) => item.id !== id),
    });
  };

  const handleUpdateItem = (id, field, value) => {
    saveState({
      ...invoiceData,
      items: invoiceData.items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      }),
    });
  };

  const handleReset = () => {
    if (window.confirm('Reset all fields to fresh default bill?')) {
      saveState(DEFAULT_INVOICE_DATA);
      showToast('Form reset to default.');
    }
  };

  // Helper to calculate grand total for sharing text
  const calculateTotal = () => {
    const taxable = invoiceData.items.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.price) || 0;
      return sum + q * p;
    }, 0);
    const gst = taxable * 0.05;
    return taxable + gst;
  };

  // Generate pristine A4 PDF object using dedicated offscreen capture vault
  const generatePdf = async () => {
    // 1. Get the dedicated offscreen A4 capture vault
    const vault = document.getElementById('invoice-capture-vault');
    if (!vault) {
      throw new Error('Invoice capture vault not found. Please try again.');
    }

    // Activate capture vault strictly during render
    vault.classList.add('vault-active');

    try {
      const captureSheet = document.getElementById('invoice-sheet-capture');
      if (!captureSheet) {
        throw new Error('Invoice capture container not ready. Please try again.');
      }

      // 2. Ensure firm logo image is loaded if present
      const logoImg = captureSheet.querySelector('.invoice-firm-logo');
      if (logoImg && !logoImg.complete) {
        await new Promise((resolve) => {
          logoImg.onload = resolve;
          logoImg.onerror = resolve;
        });
      }

      // Brief settle time for complete layout and font rasterization
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => setTimeout(r, 80));

      // 3. Capture high-res canvas at exactly standard A4 width (794px at 96 DPI)
      const targetWidth = 794;
      const targetHeight = captureSheet.scrollHeight || captureSheet.offsetHeight || 1123;

      const canvas = await html2canvas(captureSheet, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width: targetWidth,
        height: targetHeight,
        windowWidth: targetWidth,
        windowHeight: targetHeight,
      });

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas capture returned empty. Please try again.');
      }

      // 4. Construct A4 PDF with jsPDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = (canvas.height / canvas.width) * pdfWidth;

      if (!isFinite(pdfHeight) || pdfHeight <= 0) {
        throw new Error('Could not compute PDF dimensions. Please try again.');
      }

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      return pdf;
    } finally {
      vault.classList.remove('vault-active');
    }
  };

  // Increment bill number after finalising a bill (only if a valid numeric bill number was provided)
  const incrementBillNumber = () => {
    if (!invoiceData.billNumber && invoiceData.billNumber !== 0) return;
    const num = parseInt(invoiceData.billNumber, 10);
    if (isNaN(num)) return;
    const next = num + 1;
    try {
      localStorage.setItem('ajmera_last_bill_number', String(num));
    } catch { /* ignore */ }
    saveState({ ...invoiceData, billNumber: next });
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    try {
      setIsProcessing(true);
      setProcessAction('download');
      showToast('Generating official PDF file...');

      const pdf = await generatePdf();
      const billSuffix = invoiceData.billNumber ? `_Bill_${invoiceData.billNumber}` : '';
      const dateSuffix = invoiceData.invoiceDate ? `_${invoiceData.invoiceDate}` : '';
      const fileName = `Ramswaroop_Nirmal_Kumar_Ajmera_Tax_Invoice${billSuffix}${dateSuffix}.pdf`;

      // Save PDF directly with native save dialog
      pdf.save(fileName);

      showToast(invoiceData.billNumber ? `Downloaded — Bill #${invoiceData.billNumber}` : 'Downloaded PDF successfully');
      incrementBillNumber();
    } catch (err) {
      console.error('PDF error:', err);
      showToast('Error generating PDF. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessAction(null);
    }
  };

  // Share as PDF directly
  const handleSharePdf = async () => {
    try {
      setIsProcessing(true);
      setProcessAction('share');
      showToast('Preparing PDF for sharing...');

      const pdf = await generatePdf();
      const billSuffix = invoiceData.billNumber ? `_Bill_${invoiceData.billNumber}` : '';
      const custSuffix = invoiceData.customer.name ? `_${invoiceData.customer.name.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
      const fileName = `Tax_Invoice${custSuffix}${billSuffix}.pdf`;

      const blob = pdf.output('blob');
      const file = new File([blob], fileName, { type: 'application/pdf' });

      // Check if native Web Share API supports file sharing (works on Android Chrome, iOS Safari)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Tax Invoice - Ramswaroop Nirmal Kumar Ajmera`,
          text: `Tax Invoice for ${invoiceData.customer.name || 'Goods'} from Ramswaroop Nirmal Kumar Ajmera.`,
        });
        showToast('Shared successfully!');
        incrementBillNumber();
      } else {
        // Fallback for browsers that don't support direct file sharing via navigator
        pdf.save(fileName);
        setShowShareModal(true);
      }
    } catch (err) {
      // User cancelled share or browser error
      if (err.name !== 'AbortError') {
        console.error('Share error:', err);
        setShowShareModal(true);
      }
    } finally {
      setIsProcessing(false);
      setProcessAction(null);
    }
  };

  const getShareText = () => {
    const outOfRaj = isOutOfRajasthan(invoiceData);
    const taxable = invoiceData.items.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.price) || 0;
      return sum + q * p;
    }, 0);
    const tax = taxable * 0.05;
    const total = taxable + tax;
    const billLine = invoiceData.billNumber ? `*Bill No.:* ${invoiceData.billNumber}\n` : '';
    const taxLine = outOfRaj
      ? `*IGST (5%):* ₹${formatCurrency(tax)} (Inter-State Out of Rajasthan)`
      : `*CGST (2.5%):* ₹${formatCurrency(taxable * 0.025)}\n*SGST (2.5%):* ₹${formatCurrency(taxable * 0.025)}`;

    return `*TAX INVOICE - RAMSWAROOP NIRMAL KUMAR AJMERA*\nSadar Bazar, Banera (Rajasthan)\nGSTIN: 08ACZPA7669Q1ZC\n\n${billLine}*Bill To:* ${invoiceData.customer.name || 'Customer'}\n*Date:* ${formatDateToIndian(invoiceData.invoiceDate)}\n*Place of Supply:* ${invoiceData.placeOfSupply || (outOfRaj ? 'Out of Rajasthan' : 'Rajasthan')}\n*Taxable Amount:* ₹${formatCurrency(taxable)}\n${taxLine}\n*Total Amount:* ₹${formatCurrency(total)}\n\n*Bank Details:*\nBank: ${invoiceData.bankDetails.bankName}\nA/C: ${invoiceData.bankDetails.accountNo}\nIFSC: ${invoiceData.bankDetails.ifscCode}\nPhonePe / UPI: ${invoiceData.bankDetails.phonePe || '9414255366'}`;
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Tax Invoice - Ramswaroop Nirmal Kumar Ajmera`);
    const body = encodeURIComponent(getShareText());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(getShareText());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
    showToast('Invoice summary copied to clipboard!');
  };

  const isInterState = isOutOfRajasthan(invoiceData);

  return (
    <div className="app-layout">
      {/* Top Header */}
      <Header
        onDownloadPdf={handleDownloadPdf}
        onSharePdf={handleSharePdf}
        onReset={handleReset}
        isProcessing={isProcessing}
        processAction={processAction}
        isOutOfRajasthan={isInterState}
      />

      {/* Mobile Top Tabs */}
      <div className="mobile-view-tabs">
        <button
          className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={() => setActiveTab('editor')}
        >
          <FileText size={16} />
          <span>1. Fill Bill Details</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          <Eye size={16} />
          <span>2. View Tax Invoice</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Editor Form Column */}
        <div className={`editor-panel ${activeTab === 'preview' ? 'hide-on-mobile' : ''}`}>
          <InvoiceForm
            invoiceData={invoiceData}
            onUpdateInvoice={handleUpdateInvoice}
            onUpdateCustomer={handleUpdateCustomer}
            onUpdateBank={handleUpdateBank}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onUpdateItem={handleUpdateItem}
          />
        </div>

        {/* Live Preview Column */}
        <div className={`preview-panel ${activeTab === 'editor' ? 'hide-on-mobile' : ''}`}>
          <div className="preview-top-toolbar">
            <div className="preview-top-badge">
              <span className="live-indicator"></span>
              <span>Live Tax Invoice (A4)</span>
            </div>

            {/* Mobile zoom fit toggle */}
            <button
              type="button"
              className="btn btn-sm btn-secondary mobile-zoom-toggle"
              onClick={() => setMobileFitToScreen(!mobileFitToScreen)}
              title={mobileFitToScreen ? 'Show 100% full scale' : 'Fit to phone screen'}
            >
              {mobileFitToScreen ? (
                <>
                  <ZoomIn size={14} />
                  <span>Actual Size</span>
                </>
              ) : (
                <>
                  <ZoomOut size={14} />
                  <span>Fit Phone Screen</span>
                </>
              )}
            </button>
          </div>

          <div className={`invoice-scale-container ${mobileFitToScreen ? 'fit-mobile' : 'scroll-mobile'}`}>
            <InvoicePreview invoiceData={invoiceData} ref={invoiceSheetRef} />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Fixed Action Bar */}
      <div className="mobile-bottom-bar">
        {activeTab === 'editor' ? (
          <>
            <button
              type="button"
              className="mobile-bar-btn mobile-bar-btn-secondary"
              onClick={() => setActiveTab('preview')}
            >
              <Eye size={17} />
              <span>Preview</span>
            </button>
            <button
              type="button"
              className="mobile-bar-btn mobile-bar-btn-share"
              onClick={handleSharePdf}
              disabled={isProcessing}
            >
              {isProcessing && processAction === 'share' ? (
                <>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div>
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <Share2 size={17} />
                  <span>Share PDF</span>
                </>
              )}
            </button>
            <button
              type="button"
              className="mobile-bar-btn mobile-bar-btn-primary"
              onClick={handleDownloadPdf}
              disabled={isProcessing}
            >
              {isProcessing && processAction === 'download' ? (
                <>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent' }}></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Download size={17} />
                  <span>Download</span>
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="mobile-bar-btn mobile-bar-btn-secondary"
              onClick={() => setActiveTab('editor')}
            >
              <FileText size={17} />
              <span>Edit Details</span>
            </button>
            <button
              type="button"
              className="mobile-bar-btn mobile-bar-btn-share"
              onClick={handleSharePdf}
              disabled={isProcessing}
            >
              {isProcessing && processAction === 'share' ? (
                <>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div>
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <Share2 size={17} />
                  <span>Share PDF</span>
                </>
              )}
            </button>
            <button
              type="button"
              className="mobile-bar-btn mobile-bar-btn-primary"
              onClick={handleDownloadPdf}
              disabled={isProcessing}
            >
              {isProcessing && processAction === 'download' ? (
                <>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent' }}></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Download size={17} />
                  <span>Download</span>
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Offscreen dedicated container for pristine A4 PDF generation without affecting screen view */}
      <div id="invoice-capture-vault" className="invoice-capture-vault" aria-hidden="true">
        <InvoicePreview invoiceData={invoiceData} id="invoice-sheet-capture" />
      </div>

      {/* Share Modal for desktop / multi-platform fallback */}
      {showShareModal && (
        <div className="modal-backdrop" onClick={() => setShowShareModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <Share2 size={20} className="modal-icon" />
                <h3>Share Invoice</h3>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowShareModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-desc">
                Your PDF file has been downloaded. You can also share the invoice directly via:
              </p>

              <div className="share-options-list">
                <button
                  type="button"
                  className="share-option-btn btn-whatsapp"
                  onClick={handleShareWhatsApp}
                >
                  <MessageCircle size={20} />
                  <div className="share-btn-text">
                    <span className="share-btn-title">Share on WhatsApp</span>
                    <span className="share-btn-sub">Send bill summary & details to customer</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="share-option-btn btn-email"
                  onClick={handleShareEmail}
                >
                  <Mail size={20} />
                  <div className="share-btn-text">
                    <span className="share-btn-title">Send via Email</span>
                    <span className="share-btn-sub">Open email client with invoice details</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="share-option-btn btn-copy"
                  onClick={handleCopySummary}
                >
                  {copiedText ? <Check size={20} className="text-success" /> : <Copy size={20} />}
                  <div className="share-btn-text">
                    <span className="share-btn-title">{copiedText ? 'Copied to Clipboard!' : 'Copy Bill Summary'}</span>
                    <span className="share-btn-sub">Copy details and paste anywhere</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="share-option-btn btn-download-alt"
                  onClick={handleDownloadPdf}
                >
                  <Download size={20} />
                  <div className="share-btn-text">
                    <span className="share-btn-title">Download PDF Again</span>
                    <span className="share-btn-sub">Save a fresh copy of the PDF</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen loading overlay while generating PDF */}
      {isProcessing && (
        <div className="pdf-generation-overlay" aria-live="assertive">
          <div className="pdf-generation-card">
            <div className="pdf-spinner"></div>
            <h4>
              {processAction === 'share'
                ? 'Preparing Tax Invoice for Sharing...'
                : 'Generating Official Tax Invoice PDF...'}
            </h4>
            <p>Creating pixel-perfect A4 tax invoice, please wait a moment...</p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
