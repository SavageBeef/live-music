import React from 'react';

function CartModal({
  isOpen,
  onClose,
  cart,
  totalCartPrice,
  isOffline,
  submitting,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) {
	if (!isOpen) return null;

	return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-scrollable modal-lg modal-dialog-centered">
        <div className="modal-content bg-dark text-white border border-secondary border-opacity-50 rounded-4 shadow-lg">
          
          {/* Drawer Header */}
          <div className="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3">
            <h5 className="modal-title font-monospace text-warning fw-bold d-flex align-items-center gap-2">
              <span>🛒</span> CHECKOUT BASKET
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
            ></button>
          </div>

          {/* Drawer Body */}
          <div className="modal-body px-4 py-3">
            {cart.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-white-50 font-monospace mb-0">Your shopping basket is empty.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle mb-0">
                  <thead className="text-warning font-monospace small">
                    <tr>
                      <th>ITEM</th>
                      <th className="text-center">PRICE</th>
                      <th className="text-center">QTY</th>
                      <th className="text-end">SUBTOTAL</th>
                      <th className="text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.id}>
                        <td className="fw-bold font-monospace">{item.name}</td>
                        <td className="text-center font-monospace">${item.price.toFixed(2)}</td>
                        <td className="text-center">
                          <div className="d-inline-flex align-items-center gap-2 bg-secondary bg-opacity-25 px-2 py-1 rounded-pill border border-secondary border-opacity-25">
                            <button 
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="btn btn-sm btn-outline-warning p-0 px-2 rounded-circle"
                              style={{ lineHeight: '1' }}
                            >
                              −
                            </button>
                            <span className="font-monospace fw-bold px-1">{item.quantity}</span>
                            <button 
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="btn btn-sm btn-outline-warning p-0 px-2 rounded-circle"
                              style={{ lineHeight: '1' }}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="text-end font-monospace fw-bold text-warning">
                          ${(item.price * item.quantity).toFixed(2)}
                        </td>
                        <td className="text-center">
                          <button 
                            onClick={() => onRemoveItem(item.id)}
                            className="btn btn-sm btn-outline-danger border-0 rounded-circle"
                            title="Delete item"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          {cart.length > 0 && (
            <div className="modal-footer border-top border-secondary border-opacity-25 px-4 py-3 d-flex justify-content-between align-items-center">
              <div>
                <span className="text-white-50 font-monospace small d-block">TOTAL AMOUNT DUE</span>
                <span className="fs-3 font-monospace fw-bold text-warning">
                  ${totalCartPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="d-flex gap-2">
                <button 
                  type="button" 
                  className="btn btn-outline-light font-monospace rounded-pill px-4"
                  onClick={onClose}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  onClick={onCheckout}
                  disabled={isOffline || submitting}
                  className="btn btn-warning text-dark font-monospace fw-bold rounded-pill px-5 shadow"
                >
                  {submitting ? "Processing Transaction..." : "Complete Purchase"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default CartModal;