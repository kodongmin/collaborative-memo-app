import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MemoListPage from './pages/MemoListPage';
import MemoEditPage from './pages/MemoEditPage';
import MemoDetailPage from './pages/MemoDetailPage';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

function KakaoAppBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = Boolean(localStorage.getItem('token'));
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  return (
    <AppBar position="static" sx={{
      background: '#FFEB3B',
      boxShadow: '0 2px 8px 0 rgba(255,214,0,0.08)',
      color: '#222',
    }}>
      <Toolbar>
        <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 1, color: '#222' }}>
          Memo Cloud
        </Typography>
        {isLoggedIn && location.pathname.startsWith('/memos') && (
          <Button color="inherit" startIcon={<LogoutIcon sx={{ color: '#222' }} />} onClick={handleLogout} sx={{ fontWeight: 600, color: '#222' }}>
            로그아웃
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}

function App() {
  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFFDE4 0%, #FFF9C4 100%)',
      pb: 8
    }}>
      <Router>
        <KakaoAppBar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/memos" element={<MemoListPage />} />
          <Route path="/memos/new" element={<MemoEditPage />} />
          <Route path="/memos/:id/edit" element={<MemoEditPage />} />
          <Route path="/memos/:id" element={<MemoDetailPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </Box>
  );
}

export default App;
