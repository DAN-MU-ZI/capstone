import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Library from './pages/Library';
import Footer from './components/Footer';
import Header from './components/Header';
import Flow from './pages/Flow';
import LessonPage from './pages/LessonPage';
import MyPage from './pages/MyPage';
import Onboarding from './pages/Onboarding';
import Register from './pages/Register';
import Login from './pages/Login';

const App: React.FC = () => {
  return (
    <div className="App">
      <Header />
      <Routes>
        {/* Onboarding, Library, Flow, LessonPage로 라우팅 설정 */}
        <Route path="/" element={<Login />} />
        <Route path="/library" element={<Library />} />
        <Route path="/flow/:programId" element={<Flow />} />
        <Route path="/create" element={<Onboarding />} />
        <Route path="/my" element={<MyPage />} />
        <Route path="/lesson/:lessonId" element={<LessonPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Register />} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
