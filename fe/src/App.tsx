import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Library from './pages/Library';
import Footer from './components/Footer';
import Header from './components/Header';
import Flow from './pages/Flow';
import LessonPage from './pages/LessonPage';

const App: React.FC = () => {
  return (
    <div className="App">
      <Header />
      <Routes>
        {/* Onboarding, Library, Flow, LessonPage로 라우팅 설정 */}
        <Route path="/" element={<Onboarding />} />
        <Route path="/library" element={<Library />} />
        <Route path='/flow' element={<Flow />} />
        <Route path="/lesson/:lessonId" element={<LessonPage />} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
