import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Library from './pages/Library';
import Footer from './components/Footer';
import Header from './components/Header';

const App: React.FC = () => {
  return (
    <div className="App">
      <Header />
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/library" element={<Library />} />
      </Routes>
      <Footer />
    </div >
  );
};

export default App;
