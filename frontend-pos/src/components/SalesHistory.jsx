import React, { useState, useEffect } from 'react';

function SalesHistory({ isOffline }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null); // Receipt modal target

  const fetchSales = () => {
    setLoading(true);
    fetch('http://localhost:5000/api/sales')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setSales(data);
        setError(null);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);

  if (loading) {
    return (
      <div className="container py-5 text-center text-white-50 font-monospace">
        <div className="spinner-border text-warning mb-3" role="status"></div>
        <p>Loading transaction ledger from SQLite...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger font-monospace border-0 shadow-lg">
          <h5 className="fw-bold">⚠️ Ledger Sync Failed</h5>
          <p className="mb-2">{error}</p>
          <button onClick={fetchSales} className="btn btn-sm btn-outline-danger font-monospace">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header & High-Level POS Metrics */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-black text-dark font-monospace mb-1">
            <span className="text-warning">📊</span> TRANSACTION HISTORY
          </h2>
          <p className="text-muted font-monospace small mb-0">
            Audit log of completed customer checkout sessions and sales receipts.
          </p>
        </div>

        <button 
          onClick={fetchSales} 
          disabled={isOffline}
          className="btn btn-outline-dark rounded-pill font-monospace small px-3 py-1.5 d-flex align-items-center gap-2 shadow-sm fw-semibold"
        >
          🔄 Refresh Ledger
        </button>
      </div>

      {/* Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-6 col-lg-3">
          <div className="bg-dark text-white p-3 rounded-4 border border-secondary border-opacity-25 shadow-sm">
            <span className="text-white-50 font-monospace small d-block">TOTAL REVENUE</span>
            <span className="fs-3 fw-bold font-monospace text-warning">
              ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="bg-dark text-white p-3 rounded-4 border border-secondary border-opacity-25 shadow-sm">
            <span className="text-white-50 font-monospace small d-block">TOTAL TRANSACTIONS</span>
            <span className="fs-3 fw-bold font-monospace text-white">
              {sales.length} {sales.length === 1 ? 'Sale' : 'Sales'}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      {sales.length === 0 ? (
        <div className="text-center py-5 bg-dark rounded-4 border border-secondary border-opacity-25">
          <p className="text-white-50 font-monospace mb-0">No sales transactions recorded in SQLite yet.</p>
        </div>
      ) : (
        <div className="table-responsive bg-dark rounded-4 border border-secondary border-opacity-25 shadow-lg">
          <table className="table table-dark table-hover align-middle mb-0">
            <thead className="text-warning font-monospace small border-bottom border-secondary border-opacity-50">
              <tr>
                <th className="px-4 py-3">RECEIPT #</th>
                <th className="py-3">TIMESTAMP</th>
                <th className="text-center py-3">ITEMS SOLD</th>
                <th className="text-end py-3">TOTAL AMOUNT</th>
                <th className="text-center px-4 py-3">RECEIPT DETAILS</th>
              </tr>
            </thead>
            <tbody className="font-monospace">
              {sales.map(sale => {
                const totalItemsCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
                const formattedDate = sale.transaction_time 
									? new Date(sale.transaction_time.replace(' ', 'T') + 'Z').toLocaleString() 
									: 'N/A';

                return (
                  <tr key={sale.id}>
                    <td className="px-4 fw-bold text-warning">#{sale.id}</td>
                    <td className="text-white-50 small">{formattedDate}</td>
                    <td className="text-center">
                      <span className="badge bg-secondary bg-opacity-25 text-white border border-secondary border-opacity-25 rounded-pill px-3 py-1">
                        {totalItemsCount} {totalItemsCount === 1 ? 'unit' : 'units'}
                      </span>
                    </td>
                    <td className="text-end fw-bold text-white">
                      ${sale.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-center px-4">
                      <button 
                        onClick={() => setSelectedReceipt(sale)}
                        className="btn btn-sm btn-outline-warning rounded-pill px-3"
                      >
                        View Receipt 📄
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Itemized Receipt Modal */}
      {selectedReceipt && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border border-secondary border-opacity-50 rounded-4 shadow-lg">
              
              <div className="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3">
                <div>
                  <h5 className="modal-title font-monospace text-warning fw-bold mb-0">
                    RECEIPT #{selectedReceipt.id}
                  </h5>
                  <span className="text-white-50 font-monospace small" style={{ fontSize: '0.75rem' }}>
                    {selectedReceipt.transaction_time 
											? new Date(selectedReceipt.transaction_time.replace(' ', 'T') + 'Z').toLocaleString() 
											: 'N/A'}
                  </span>
                </div>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setSelectedReceipt(null)}
                ></button>
              </div>

              <div className="modal-body px-4 py-3">
                <table className="table table-dark align-middle mb-0">
                  <thead className="text-warning font-monospace small">
                    <tr>
                      <th>ITEM</th>
                      <th className="text-center">QTY</th>
                      <th className="text-end">UNIT PRICE</th>
                      <th className="text-end">SUBTOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="font-monospace small">
                    {selectedReceipt.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="fw-bold">{item.name}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-end">${item.unit_price.toFixed(2)}</td>
                        <td className="text-end text-warning">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="modal-footer border-top border-secondary border-opacity-25 px-4 py-3 d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-white-50 font-monospace small d-block">TOTAL CHARGED</span>
                  <span className="fs-4 font-monospace fw-bold text-warning">
                    ${selectedReceipt.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <button 
                  type="button" 
                  className="btn btn-outline-light font-monospace rounded-pill px-4"
                  onClick={() => setSelectedReceipt(null)}
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesHistory;