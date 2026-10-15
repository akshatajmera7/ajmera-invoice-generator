import React, { forwardRef } from 'react';
import { formatCurrency, formatDateToIndian } from '../utils/formatters';
import { numberToIndianWords } from '../utils/numberToWords';

const InvoicePreview = forwardRef(({ invoiceData }, ref) => {
  const { customer, items, bankDetails } = invoiceData;

  // Calculate totals
  let totalQty = 0;
  let totalTaxable = 0;

  const calculatedItems = items.map((item, index) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.price) || 0;
    const itemAmount = qty * rate; // Clean item amount without GST

    totalQty += qty;
    totalTaxable += itemAmount;

    return {
      sr: index + 1,
      name: item.name || '',
      quantity: qty,
      unit: item.unit || 'Pcs',
      price: rate,
      amount: itemAmount,
    };
  });

  // GST added later on below the main items table (2.5% CGST + 2.5% SGST)
  const totalCgst = totalTaxable * 0.025;
  const totalSgst = totalTaxable * 0.025;
  const totalTax = totalCgst + totalSgst;
  const grandTotal = totalTaxable + totalTax;

  const amountInWords = numberToIndianWords(grandTotal);

  // Minimum rows so visual structure matches classic commercial bills
  const minRows = 3;
  const emptyRowsCount = Math.max(0, minRows - calculatedItems.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  // City and Zip formatting
  const cityZipParts = [customer.city, customer.zipCode].filter(Boolean);
  const cityZipText = cityZipParts.join(' - ');

  return (
    <div className="invoice-preview-wrapper">
      <div
        className="invoice-a4-sheet"
        ref={ref}
        id="invoice-sheet"
      >
        {/* Top Centered Title */}
        <div className="tax-invoice-title">TAX INVOICE</div>

        <div className="invoice-outer-box">
          {/* Header Firm Section */}
          <div className="invoice-header-grid">
            <div className="invoice-header-logo-box">
              <img
                src="/logo.png"
                alt="House of Ajmera Logo"
                className="invoice-firm-logo"
              />
            </div>
            <div className="invoice-header-info-box">
              <h1 className="firm-name-heading">RAMSWAROOP NIRMAL KUMAR AJMERA</h1>
              <p className="firm-address-text">Sadar Bazar, Banera</p>
              <div className="firm-meta-grid">
                <div className="meta-col">
                  <div>
                    <span className="meta-label">Phone: </span>
                    <span className="meta-value">9929335953, 9414255366</span>
                  </div>
                  <div>
                    <span className="meta-label">GSTIN: </span>
                    <span className="meta-value">08ACZPA7669Q1ZC</span>
                  </div>
                </div>
                <div className="meta-col">
                  <div>
                    <span className="meta-label">Email: </span>
                    <span className="meta-value">arvindajmera1976@gmail.com</span>
                  </div>
                  <div>
                    <span className="meta-label">State: </span>
                    <span className="meta-value">Rajasthan</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To & Invoice Details Section */}
          <div className="invoice-sub-grid">
            <div className="sub-box sub-box-bill-to">
              <div className="sub-box-title">Bill To:</div>
              <div className="sub-box-content bill-to-content">
                {customer.name && <div className="bill-name">{customer.name}</div>}
                {customer.address && <div className="bill-line">{customer.address}</div>}
                {cityZipText && <div className="bill-line">{cityZipText}</div>}
                <div className="bill-line">
                  <span className="meta-label">State: </span>
                  <span className="meta-value">{customer.state || 'Rajasthan'}</span>
                </div>
                {customer.gstin && (
                  <div className="bill-line">
                    <span className="meta-label">GSTIN: </span>
                    <span className="meta-value">{customer.gstin}</span>
                  </div>
                )}
                {customer.contact && (
                  <div className="bill-line">
                    <span className="meta-label">Phone: </span>
                    <span className="meta-value">{customer.contact}</span>
                  </div>
                )}
                {!customer.name && !customer.address && !cityZipText && !customer.gstin && (
                  <div className="bill-placeholder">
                    <span>, Rajasthan</span>
                    <span>India</span>
                    <span>GSTIN: </span>
                  </div>
                )}
              </div>
            </div>

            <div className="sub-box sub-box-details">
              <div className="sub-box-title">Invoice Details:</div>
              <div className="sub-box-content details-content">
                <div className="detail-row">
                  <span className="detail-label">Bill No.:</span>
                  <span className="detail-value" style={{ fontWeight: 700 }}>
                    {invoiceData.billNumber || 19}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">
                    {formatDateToIndian(invoiceData.invoiceDate)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Place Of Supply:</span>
                  <span className="detail-value">{invoiceData.placeOfSupply || 'Rajasthan'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table (GST Column Removed - GST Added Below Table) */}
          <div className="invoice-table-container">
            <table className="invoice-items-table">
              <thead>
                <tr>
                  <th className="col-sr">Sr.no</th>
                  <th className="col-desc">Item name</th>
                  <th className="col-qty">Quantity</th>
                  <th className="col-unit">Unit</th>
                  <th className="col-price">Price/ Unit(Rs)</th>
                  <th className="col-amt">Amount(Rs)</th>
                </tr>
              </thead>
              <tbody>
                {calculatedItems.map((item) => (
                  <tr key={item.sr} className="item-row">
                    <td className="col-sr">{item.sr}</td>
                    <td className="col-desc">{item.name || '-'}</td>
                    <td className="col-qty">{item.quantity || '-'}</td>
                    <td className="col-unit">{item.unit || 'Pcs'}</td>
                    <td className="col-price">Rs. {formatCurrency(item.price)}</td>
                    <td className="col-amt">Rs. {formatCurrency(item.amount)}</td>
                  </tr>
                ))}

                {emptyRows.map((_, i) => (
                  <tr key={`empty-${i}`} className="item-row empty-row">
                    <td className="col-sr">&nbsp;</td>
                    <td className="col-desc">&nbsp;</td>
                    <td className="col-qty">&nbsp;</td>
                    <td className="col-unit">&nbsp;</td>
                    <td className="col-price">&nbsp;</td>
                    <td className="col-amt">&nbsp;</td>
                  </tr>
                ))}

                {/* Subtotal Row */}
                <tr className="table-total-row">
                  <td colSpan={2} className="col-total-label">Total</td>
                  <td className="col-qty bold-val">{totalQty > 0 ? totalQty : 1}</td>
                  <td className="col-unit"></td>
                  <td className="col-price"></td>
                  <td className="col-amt bold-val">Rs. {formatCurrency(totalTaxable)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Summary & Totals Section - Where GST is Added */}
          <div className="invoice-bottom-split">
            {/* Left Column: Tax Summary */}
            <div className="tax-summary-box">
              <div className="tax-summary-title">Tax Summary:</div>
              <table className="tax-summary-table">
                <thead>
                  <tr>
                    <th>Taxable amount (Rs)</th>
                    <th>CGST (2.5%)</th>
                    <th>SGST (2.5%)</th>
                    <th>Total Tax (Rs)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="num-cell">{formatCurrency(totalTaxable)}</td>
                    <td className="num-cell">{formatCurrency(totalCgst)}</td>
                    <td className="num-cell">{formatCurrency(totalSgst)}</td>
                    <td className="num-cell">{formatCurrency(totalTax)}</td>
                  </tr>
                  <tr className="tax-total-line">
                    <td className="bold-cell">TOTAL: {formatCurrency(totalTaxable)}</td>
                    <td className="num-cell bold-cell">{formatCurrency(totalCgst)}</td>
                    <td className="num-cell bold-cell">{formatCurrency(totalSgst)}</td>
                    <td className="num-cell bold-cell">{formatCurrency(totalTax)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right Column: Totals (Sub Total + CGST + SGST = Grand Total) */}
            <div className="totals-box">
              <div className="totals-row">
                <span className="totals-label">Sub Total :</span>
                <span className="totals-value">Rs. {formatCurrency(totalTaxable)}</span>
              </div>
              <div className="totals-row">
                <span className="totals-label">CGST (2.5%) :</span>
                <span className="totals-value">Rs. {formatCurrency(totalCgst)}</span>
              </div>
              <div className="totals-row">
                <span className="totals-label">SGST (2.5%) :</span>
                <span className="totals-value">Rs. {formatCurrency(totalSgst)}</span>
              </div>
              <div className="totals-row totals-grand-total">
                <span className="totals-label">Total :</span>
                <span className="totals-value">Rs. {formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="amount-in-words-box">
            <div className="words-title">Invoice Amount in Words:</div>
            <div className="words-content">{amountInWords}</div>
          </div>

          {/* Bank Details Section */}
          <div className="bank-details-box">
            <div className="bank-details-header">Bank Details:</div>
            <div className="bank-details-content">
              <div className="bank-row">
                <span className="b-label">Name :</span>
                <span className="b-val">{bankDetails.bankName || 'STATE BANK OF INDIA, BANERA'}</span>
              </div>
              <div className="bank-row">
                <span className="b-label">Account No. :</span>
                <span className="b-val">{bankDetails.accountNo || '37146612448'}</span>
              </div>
              <div className="bank-row">
                <span className="b-label">IFSC code :</span>
                <span className="b-val">{bankDetails.ifscCode || 'SBIN0031097'}</span>
              </div>
              <div className="bank-row">
                <span className="b-label">Account holder's name :</span>
                <span className="b-val">{bankDetails.accountHolder || 'RAMSWAROOP NIRMAL KUMAR AJMERA'}</span>
              </div>
              {bankDetails.phonePe && (
                <div className="bank-row">
                  <span className="b-label">PhonePe / UPI :</span>
                  <span className="b-val">{bankDetails.phonePe}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

InvoicePreview.displayName = 'InvoicePreview';

export default InvoicePreview;
