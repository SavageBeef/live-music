const ProductCard = ({ product, onAddToCart }) => {
  return (
    // col-md-6 (2 cards on tablets) | col-lg-4 (3 cards on laptops) | col-xl-3 (4 cards on desktops)
    <div className="col-md-6 col-lg-4 mb-4">
      {/* Added custom-card class for smooth scaling animations */}
      <div className="card h-100 border-0 shadow-sm overflow-hidden custom-card bg-white p-2">
        
        {/* Image Container with fixed aspect ratio */}
        <div style={{ height: '240px', overflow: 'hidden' }} className="position-relative">
          <img 
            src={product.image_url} 
            className="card-img-top w-100 h-100 object-fit-contain" 
            alt={product.name} 
          />
          {/* Sleek, understated brand tag overlaid directly onto the image */}
          <span className="position-absolute top-0 end-0 m-3 badge bg-dark bg-opacity-75 font-monospace text-uppercase tracking-wider px-2 py-1.5 small shadow-sm">
            {product.brand}
          </span>
        </div>
        
        {/* Card Content Area */}
        <div className="card-body d-flex flex-column p-4">
          <h5 className="card-title fw-bold text-dark mb-2">{product.name}</h5>

          <p className="card-text text-muted small mb-4 lh-base">
            {product.description}
          </p>
          
          {/* Footer Area: Price & Action */}
          <div className="mt-auto pt-3 border-top border-light d-flex justify-content-between align-items-center">
            <div>
              <span className="text-muted d-block small text-uppercase font-monospace tracking-wider" style={{ fontSize: '0.75rem' }}>Price</span>
              <span className="h4 fw-bold text-dark mb-0">${product.price.toLocaleString()}</span>
            </div>
            
            <div className="d-flex flex-column align-items-center" style={{ minWidth: '140px' }}>
              <div className="mb-2 text-center">
                {product.stock > 0 ? (
                  <span className="badge bg-light text-muted font-monospace border fw-normal" style={{ fontSize: '0.7rem' }}>
                    {product.stock} available
                  </span>
                ) : (
                  <span className="badge bg-danger bg-opacity-10 text-danger font-monospace fw-normal" style={{ fontSize: '0.7rem' }}>
                    Sold Out
                  </span>
                )}
              </div>

              {/* Theme-matched Button: Gold accent when active, matches the Hero button style */}
              <button 
                onClick={() => onAddToCart(product)}
                className={`btn px-4 py-2 rounded-pill fw-bold text-uppercase tracking-wider btn-sm shadow-sm transition-all ${
                  product.stock > 0 
                    ? 'btn-warning text-dark fw-bold hover-gold' 
                    : 'btn-secondary text-white disabled'
                }`}
              >
                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;