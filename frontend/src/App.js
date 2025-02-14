import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import Layout from './components/Layout';
import SignIn from './pages/SignIn';
import POS from './pages/POS';
import Products from './pages/Products';
import Invoices from './pages/Invoices';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/pos" />} />
                <Route path="/pos" element={<POS />} />
                <Route path="/products" element={<Products />} />
                <Route path="/invoices" element={<Invoices />} />
              </Routes>
            </Layout>
          } />
          <Route path="*" element={<Navigate to="/signin" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
