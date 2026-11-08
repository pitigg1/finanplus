import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import global styles
// Ensure these paths are correct relative to src/index.js
// If the files are missing, the build will fail.
import 'bootstrap-icons/font/bootstrap-icons.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
