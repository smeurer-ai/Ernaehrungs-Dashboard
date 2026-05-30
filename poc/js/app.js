import { greet } from './js/test.js';

const App = () => <h1>{greet('Stephanie')}</h1>;

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
