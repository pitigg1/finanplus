import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { inicializarTema } from './lib/tema';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/apple.css';
import './styles/vistas.css';
import './styles/ios.css';
import './styles/inicio.css';

inicializarTema();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
