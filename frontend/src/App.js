
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import HomeScreen from "./screen/HomeScreen";
import ProductScreen from './screen/ProductScreen';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <header className="App-header">
          <Link to="/">Tnalp</Link>
        </header>
        <main>
          <Routes>
            <Route path="/product/:slug" element={<ProductScreen />}></Route>
            <Route path="/" element={<HomeScreen />}></Route>
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
