import React, { useState, useEffect } from 'react';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Replace with your local IP if testing on a phone
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => console.error("Error fetching guitars:", err));
  }, []);

  if (loading) return <h2>Tuning the instruments... (Loading)</h2>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>🎸 Melody Manager Inventory</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {products.map(item => (
          <div key={item.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
            <h3>{item.brand} {item.name}</h3>
            <p>Price: ${item.price}</p>
            <p style={{ color: item.stock < 5 ? 'red' : 'green' }}>
              {item.stock > 0 ? `In Stock: ${item.stock}` : 'Out of Stock'}
            </p>
            <button disabled={item.stock === 0}>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;