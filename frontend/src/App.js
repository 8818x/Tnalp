import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import HomeScreen from "./screen/HomeScreen";
import ProductScreen from './screen/ProductScreen';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import { LinkContainer } from 'react-router-bootstrap';

function App() {
  return (
    <BrowserRouter>
      <div className="d-flex flex-column site-container">
        <header className="App-header">
          <Navbar bg="dark" variant="dark">
            <Container>
              <LinkContainer to="/">
                <Navbar.Brand>Tnalp</Navbar.Brand>
              </LinkContainer>
            </Container>
          </Navbar>
        </header>
        <main>
          <Container>
            <Routes>
              <Route path="/product/:slug" element={<ProductScreen />}></Route>
              <Route path="/" element={<HomeScreen />}></Route>
            </Routes>
          </Container>
        </main>
        <footer>
          <div className='text-center'>© 2023 Tnalp. All rights reserved</div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
