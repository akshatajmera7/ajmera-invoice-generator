import React, { useState, useRef } from 'react';
import Header from './components/Header';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import { getTodayDateInput, formatCurrency } from './utils/formatters';
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

const DEFAULT_INVOICE_DATA = {
  invoiceDate: getTodayDateInput(),
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
          bankDetails: {
            ...DEFAULT_INVOICE_DATA.bankDetails,
            ...(parsed.bankDetails || {}),
          },
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_INVOICE_DATA;
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

  // Generate PDF Blob
  const generatePdfBlob = async () => {
    // If user is on editor tab, temporarily switch to preview so #invoice-sheet is in DOM
    let switchedTab = false;
    if (activeTab !== 'preview') {
      setActiveTab('preview');
      switchedTab = true;
      // Wait for React to render the preview tab
      await new Promise((r) => setTimeout(r, 350));
    }

    const invoiceEl = document.getElementById('invoice-sheet');
    if (!invoiceEl) throw new Error('Invoice sheet element not found');

    // --- Neutralise all CSS zoom / transform so html2canvas sees the full-scale sheet ---
    const containerEl = invoiceEl.closest('.invoice-scale-container');

    // Temporarily strip the fit-mobile class (which applies zoom via CSS)
    const hadFitMobile = containerEl && containerEl.classList.contains('fit-mobile');
    if (hadFitMobile) containerEl.classList.remove('fit-mobile');

    // Also force inline zoom=1 to override any residual browser zoom
    const originalZoom = invoiceEl.style.zoom;
    const originalTransform = invoiceEl.style.transform;
    invoiceEl.style.zoom = '1';
    invoiceEl.style.transform = 'none';

    // Give browser a moment to repaint at full scale before capture
    await new Promise((r) => setTimeout(r, 100));

    let canvas;
    try {
      canvas = await html2canvas(invoiceEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: invoiceEl.scrollWidth,
        windowHeight: invoiceEl.scrollHeight,
        width: invoiceEl.scrollWidth,
        height: invoiceEl.scrollHeight,
        x: 0,
        y: 0,
      });
    } finally {
      // Always restore original state
      invoiceEl.style.zoom = originalZoom;
      invoiceEl.style.transform = originalTransform;
      if (hadFitMobile) containerEl.classList.add('fit-mobile');
      if (switchedTab) setActiveTab('editor');
    }

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

    const rawBlob = pdf.output('blob');
    return new Blob([rawBlob], { type: 'application/pdf' });
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    try {
      setIsProcessing(true);
      setProcessAction('download');
      showToast('Generating official PDF file...');

      const blob = await generatePdfBlob();
      const blobUrl = URL.createObjectURL(blob);
      const fileName = `Ramswaroop_Nirmal_Kumar_Ajmera_Tax_Invoice_${invoiceData.invoiceDate || 'bill'}.pdf`;

      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = fileName;
      downloadLink.setAttribute('target', '_blank');
      document.body.appendChild(downloadLink);
      downloadLink.click();

      setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(blobUrl);
      }, 3000);

      showToast(`Downloaded ${fileName}`);
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

      const blob = await generatePdfBlob();
      const fileName = `Tax_Invoice_${invoiceData.customer.name ? invoiceData.customer.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Ajmera'}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });

      // Check if native Web Share API supports file sharing (works on Android Chrome, iOS Safari, mobile browsers)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Tax Invoice - Ramswaroop Nirmal Kumar Ajmera`,
          text: `Tax Invoice for ${invoiceData.customer.name || 'Goods'} from Ramswaroop Nirmal Kumar Ajmera.`,
        });
        showToast('Shared successfully!');
      } else {
        // Fallback for browsers that don't support direct file sharing via navigator:
        // 1. Trigger the download so user has the file
        const blobUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        setTimeout(() => {
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(blobUrl);
        }, 3000);

        // 2. Open the Share modal for WhatsApp / Email / Copy summary
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
    const total = calculateTotal();
    return `*TAX INVOICE - RAMSWAROOP NIRMAL KUMAR AJMERA*\nSadar Bazar, Banera (Rajasthan)\nGSTIN: 08ACZPA7669Q1ZC\n\n*Bill To:* ${invoiceData.customer.name || 'Customer'}\n*Date:* ${invoiceData.invoiceDate}\n*Total Amount:* ₹${formatCurrency(total)}\n\n*Bank Details:*\nBank: ${invoiceData.bankDetails.bankName}\nA/C: ${invoiceData.bankDetails.accountNo}\nIFSC: ${invoiceData.bankDetails.ifscCode}\nPhonePe / UPI: ${invoiceData.bankDetails.phonePe || '9414255366'}`;
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

  return (
    <div className="app-layout">
      {/* Top Header */}
      <Header
        onDownloadPdf={handleDownloadPdf}
        onSharePdf={handleSharePdf}
        onReset={handleReset}
        isProcessing={isProcessing}
        processAction={processAction}
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
              <Share2 size={17} />
              <span>Share PDF</span>
            </button>
            <button
              type="button"
              className="mobile-bar-btn mobile-bar-btn-primary"
              onClick={handleDownloadPdf}
              disabled={isProcessing}
            >
              <Download size={17} />
              <span>Download</span>
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
              <Share2 size={17} />
              <span>Share PDF</span>
            </button>
            <button
              type="button"
              className="mobile-bar-btn mobile-bar-btn-primary"
              onClick={handleDownloadPdf}
              disabled={isProcessing}
            >
              <Download size={17} />
              <span>Download</span>
            </button>
          </>
        )}
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
