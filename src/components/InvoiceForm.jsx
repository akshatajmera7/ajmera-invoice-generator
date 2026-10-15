import React, { useState } from 'react';
import { Plus, Trash2, Building2, User, ShoppingBag, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const COMMON_UNITS = ['Pcs', 'Mtr', 'Kg', 'Box', 'Set', 'Nos', 'Roll', 'Thaan', 'Pkt'];

export default function InvoiceForm({
  invoiceData,
  onUpdateInvoice,
  onUpdateCustomer,
  onUpdateBank,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}) {
  const [showBankDetails, setShowBankDetails] = useState(true);

  const { customer, items, bankDetails } = invoiceData;

  return (
    <div className="invoice-form-container">
      {/* Invoice Meta Section */}
      <div className="form-card">
        <div className="card-header">
          <div className="card-title-group">
            <Building2 size={18} className="card-icon" />
            <h2 className="card-title">Invoice Details</h2>
          </div>
        </div>
        <div className="card-body">
          <div className="form-grid form-grid-3">
            <div className="form-group">
              <label htmlFor="billNumber">Bill No.</label>
              <input
                id="billNumber"
                type="number"
                className="form-input"
                value={invoiceData.billNumber || ''}
                onChange={(e) => onUpdateInvoice('billNumber', parseInt(e.target.value, 10) || 1)}
                placeholder="19"
                inputMode="numeric"
                min="1"
              />
            </div>
            <div className="form-group">
              <label htmlFor="invoiceDate">Invoice Date</label>
              <input
                id="invoiceDate"
                type="date"
                className="form-input"
                value={invoiceData.invoiceDate}
                onChange={(e) => onUpdateInvoice('invoiceDate', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="placeOfSupply">Place Of Supply</label>
              <input
                id="placeOfSupply"
                type="text"
                className="form-input"
                value={invoiceData.placeOfSupply}
                onChange={(e) => onUpdateInvoice('placeOfSupply', e.target.value)}
                placeholder="Rajasthan"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bill To / Customer Details Section */}
      <div className="form-card">
        <div className="card-header">
          <div className="card-title-group">
            <User size={18} className="card-icon" />
            <h2 className="card-title">Bill To (Customer Information)</h2>
          </div>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label htmlFor="customerName">Customer / Firm Name</label>
            <input
              id="customerName"
              type="text"
              className="form-input"
              value={customer.name}
              onChange={(e) => onUpdateCustomer('name', e.target.value)}
              placeholder="e.g. M/s Shree Textiles"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="customerAddress">Address</label>
            <textarea
              id="customerAddress"
              rows={2}
              className="form-input form-textarea"
              value={customer.address}
              onChange={(e) => onUpdateCustomer('address', e.target.value)}
              placeholder="Shop / House No, Street, Market Area"
            />
          </div>

          <div className="form-grid form-grid-3 form-grid-mobile-stack">
            <div className="form-group">
              <label htmlFor="customerCity">
                City <span className="label-badge">Optional</span>
              </label>
              <input
                id="customerCity"
                type="text"
                className="form-input"
                value={customer.city}
                onChange={(e) => onUpdateCustomer('city', e.target.value)}
                placeholder="e.g. Bhilwara"
              />
            </div>

            <div className="form-group">
              <label htmlFor="customerState">
                State <span className="label-badge">Optional</span>
              </label>
              <input
                id="customerState"
                type="text"
                className="form-input"
                value={customer.state}
                onChange={(e) => onUpdateCustomer('state', e.target.value)}
                placeholder="Rajasthan"
              />
            </div>

            <div className="form-group">
              <label htmlFor="customerZip">
                Zip Code <span className="label-badge">Optional</span>
              </label>
              <input
                id="customerZip"
                type="text"
                inputMode="numeric"
                className="form-input"
                value={customer.zipCode}
                onChange={(e) => onUpdateCustomer('zipCode', e.target.value)}
                placeholder="e.g. 311001"
              />
            </div>
          </div>

          <div className="form-grid form-grid-2 form-grid-mobile-stack">
            <div className="form-group">
              <label htmlFor="customerGstin">
                Customer GSTIN <span className="label-badge">Optional</span>
              </label>
              <input
                id="customerGstin"
                type="text"
                className="form-input text-uppercase"
                value={customer.gstin}
                onChange={(e) => onUpdateCustomer('gstin', e.target.value.toUpperCase())}
                placeholder="e.g. 08AAACR1234M1ZX"
              />
            </div>

            <div className="form-group">
              <label htmlFor="customerContact">
                Customer Phone <span className="label-badge">Optional</span>
              </label>
              <input
                id="customerContact"
                type="tel"
                inputMode="tel"
                className="form-input"
                value={customer.contact}
                onChange={(e) => onUpdateCustomer('contact', e.target.value)}
                placeholder="e.g. 9876543210"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="form-card">
        <div className="card-header card-header-split">
          <div className="card-title-group">
            <ShoppingBag size={18} className="card-icon" />
            <h2 className="card-title">Items / Goods</h2>
            <span className="items-counter-badge">
              {items.length} {items.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-accent"
            onClick={onAddItem}
            title="Add another item row"
          >
            <Plus size={15} />
            <span>Add Item</span>
          </button>
        </div>

        <div className="card-body">
          <div className="items-list">
            {items.map((item, index) => {
              const qty = parseFloat(item.quantity) || 0;
              const rate = parseFloat(item.price) || 0;
              const taxable = qty * rate;
              const gst = taxable * 0.05; // 5% total (2.5% CGST + 2.5% SGST)
              const total = taxable + gst;

              return (
                <div key={item.id} className="item-row-card">
                  <div className="item-row-header">
                    <span className="item-index-badge">Item #{index + 1}</span>
                    <div className="item-row-summary-chips">
                      <span className="chip chip-sub">Amount: ₹{formatCurrency(taxable)}</span>
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        className="btn-icon-danger"
                        onClick={() => onRemoveItem(item.id)}
                        title="Delete item"
                        aria-label="Delete item"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="form-grid form-grid-items">
                    <div className="form-group form-group-item-name">
                      <label>Item Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={item.name}
                        onChange={(e) => onUpdateItem(item.id, 'name', e.target.value)}
                        placeholder="e.g. Cotton Grey Fabric"
                      />
                    </div>

                    <div className="form-group form-group-item-qty">
                      <label>Qty</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        className="form-input text-right"
                        value={item.quantity}
                        onChange={(e) => onUpdateItem(item.id, 'quantity', e.target.value)}
                        placeholder="1"
                      />
                    </div>

                    <div className="form-group form-group-item-unit">
                      <label>Unit</label>
                      <input
                        type="text"
                        list="units-list"
                        className="form-input text-center"
                        value={item.unit}
                        onChange={(e) => onUpdateItem(item.id, 'unit', e.target.value)}
                        placeholder="Pcs"
                      />
                    </div>

                    <div className="form-group form-group-item-price">
                      <label>Price/Unit (₹)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        className="form-input text-right"
                        value={item.price}
                        onChange={(e) => onUpdateItem(item.id, 'price', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <datalist id="units-list">
            {COMMON_UNITS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>

          <button
            type="button"
            className="btn btn-outline btn-block mt-3 add-item-large-btn"
            onClick={onAddItem}
          >
            <Plus size={18} />
            <span>+ Add Another Item Row</span>
          </button>
        </div>
      </div>

      {/* Bank Details Section */}
      <div className="form-card">
        <div
          className="card-header card-header-clickable"
          onClick={() => setShowBankDetails(!showBankDetails)}
        >
          <div className="card-title-group">
            <CreditCard size={18} className="card-icon" />
            <h2 className="card-title">Bank Details & PhonePe</h2>
            <span className="label-badge">Pre-filled & Editable</span>
          </div>
          <button type="button" className="btn-toggle" aria-label="Toggle bank details">
            {showBankDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {showBankDetails && (
          <div className="card-body">
            <p className="form-helper-text mb-3">
              Fixed default bank details loaded from your cheque. You can edit any field if needed.
            </p>
            <div className="form-grid form-grid-2 form-grid-mobile-stack">
              <div className="form-group">
                <label htmlFor="bankName">Bank Name & Branch</label>
                <input
                  id="bankName"
                  type="text"
                  className="form-input"
                  value={bankDetails.bankName || ''}
                  onChange={(e) => onUpdateBank('bankName', e.target.value)}
                  placeholder="STATE BANK OF INDIA, BANERA"
                />
              </div>

              <div className="form-group">
                <label htmlFor="accountNo">Account Number</label>
                <input
                  id="accountNo"
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  value={bankDetails.accountNo || ''}
                  onChange={(e) => onUpdateBank('accountNo', e.target.value)}
                  placeholder="37146612448"
                />
              </div>

              <div className="form-group">
                <label htmlFor="ifscCode">IFSC Code</label>
                <input
                  id="ifscCode"
                  type="text"
                  className="form-input text-uppercase"
                  value={bankDetails.ifscCode || ''}
                  onChange={(e) => onUpdateBank('ifscCode', e.target.value.toUpperCase())}
                  placeholder="SBIN0031097"
                />
              </div>

              <div className="form-group">
                <label htmlFor="accountHolder">Account Holder's Name</label>
                <input
                  id="accountHolder"
                  type="text"
                  className="form-input text-uppercase"
                  value={bankDetails.accountHolder || ''}
                  onChange={(e) => onUpdateBank('accountHolder', e.target.value.toUpperCase())}
                  placeholder="RAMSWAROOP NIRMAL KUMAR AJMERA"
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="phonePe">
                  PhonePe / UPI Number <span className="label-badge">Payment</span>
                </label>
                <input
                  id="phonePe"
                  type="tel"
                  inputMode="tel"
                  className="form-input"
                  value={bankDetails.phonePe || ''}
                  onChange={(e) => onUpdateBank('phonePe', e.target.value)}
                  placeholder="9414255366"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
