// PoC v2: htm manuell gebunden — garantiert EINE React-Instanz
import React from 'https://esm.sh/react@18.2.0';
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client';
import htm from 'https://esm.sh/htm@3.1.1';
import { greet } from './test.js';

// htm an UNSERE React-Instanz binden (verhindert React-Versions-Konflikte)
const html = htm.bind(React.createElement);

function App() {
  return html`<h1 style=${{ fontFamily: 'sans-serif', color: 'green', padding: '20px' }}>
    ${greet('Stephanie')}
  </h1>`;
}

createRoot(document.getElementById('root')).render(html`<${App} />`);
