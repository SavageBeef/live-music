import React from 'react';

function InventoryTable({ 
  inventory, 
  handleOpenRestockModal, 
  handleEditClick, 
  handleDeleteProduct 
}) {
  return (
    <div className="table-responsive bg-dark rounded-4 border border-secondary border-opacity-25 shadow-lg">
      <table className="table table-dark table-hover align-middle mb-0 font-monospace text-nowrap">
        <thead className="text-warning font-monospace small border-bottom border-secondary border-opacity-50">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="py-3">NAME</th>
            <th className="py-3">BRAND</th>
            <th className="py-3 text-end">PRICE</th>
            <th className="py-3 text-center">CURRENT STOCK</th>
            <th className="px-4 py-3 text-center">QUICK ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item) => (
            <tr key={item.id}>
              <td className="px-4 fw-bold text-warning">#{item.id}</td>
              <td className="fw-bold text-white">{item.name}</td>
              <td>
                <span className="badge bg-secondary bg-opacity-25 text-white border border-secondary border-opacity-25 fw-normal px-2.5 py-1">
                  {item.brand}
                </span>
              </td>
              <td className="text-end fw-bold text-white">
                ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="text-center">
                {item.stock > 0 ? (
                  <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25 px-3 py-1.5 rounded-pill fw-bold">
                    {item.stock} available
                  </span>
                ) : (
                  <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25 px-3 py-1.5 rounded-pill fw-bold">
                    Sold Out
                  </span>
                )}
              </td>
              <td className="px-4 text-center">
                <div className="btn-group gap-1">
                  <button 
                    onClick={() => handleOpenRestockModal(item)} 
                    className="btn btn-sm btn-warning text-dark font-monospace px-3 rounded-pill fw-bold shadow-sm transition-all small"
                  >
                    + Restock
                  </button>
                  <button 
                    onClick={() => handleEditClick(item)} 
                    className="btn btn-sm btn-outline-light font-monospace px-3 rounded-pill transition-all small"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(item.id, item.name)} 
                    className="btn btn-sm btn-outline-danger font-monospace px-3 rounded-pill transition-all small"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InventoryTable;