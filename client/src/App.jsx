import './App.css';
import { Outlet } from "react-router-dom"
import { StrictMode } from 'react';
import Navbar from './components/Navbar';

function App() {
  return (
    <div className="App">
      <Navbar />
      <div className="page">
        <StrictMode>
          <Outlet />
        </StrictMode>
      </div>
    </div>
  );
}

export default App;