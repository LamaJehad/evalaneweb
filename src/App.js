import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landingpage';
import LoginPage from './pages/loginpage';
import SimulationPage from './pages/simulationpage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/simulation" element={<SimulationPage />} />
       
      </Routes>
    </Router>
  );
}


export default App;