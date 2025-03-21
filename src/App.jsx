import React, { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Interview from './components/Interview';
import EditQuestionnaire from './components/EditQuestionnaire';
import Signup from './components/Signup';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import Logo from './assets/logo.svg';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#e0f7fa',
    },
  },
  typography: {
    fontFamily: '"Montserrat", sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          padding: '0',
          maxWidth: '100%',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: '20px',
          borderRadius: '10px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          color: '#333',
          boxShadow: 'none',
          borderBottom: '1px solid #ddd',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          justifyContent: 'space-between',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '5px',
          padding: '10px 20px',
        },
      },
    },
  },
});

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center', // Center horizontally
  justifyContent: 'center', // Center vertically
  minHeight: '100vh',
  padding: { xs: '16px', md: '24px' }, // Add responsive padding
  maxWidth: '100%',
  margin: '0 auto', // Add horizontal margin for centering
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUsername = localStorage.getItem('username');
    if (token && storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
      if (location.pathname === '/login') {
        navigate('/dashboard');
      }
    } else {
      if (location.pathname !== '/signup') {
        navigate('/login');
      }
    }
  }, [navigate, location]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername('');
    navigate('/login');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container sx={containerStyle}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
            >
              <img src={Logo} alt="Logo" style={{ height: '40px' }} />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'left' }}>
              JOBTV
            </Typography>
            {isLoggedIn && (
              <>
                <Typography variant="body1" sx={{ marginRight: '20px' }}>
                  Welcome, {username}
                </Typography>
                <Button color="inherit" onClick={handleLogout}>Logout</Button>
              </>
            )}
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, padding: { xs: '16px', md: '24px' } }}>
          <Routes>
            <Route key="login" path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} setUsername={setUsername} />} />
            <Route key="signup" path="/signup" element={<Signup />} />
            <Route key="dashboard" path="/dashboard" element={<Dashboard />} />
            <Route key="interview" path="/interview" element={<Interview />} />
            <Route key="edit-questionnaire" path="/edit-questionnaire" element={<EditQuestionnaire username={username} onLogout={handleLogout} />} />
            <Route key="home" path="/" element={<Login setIsLoggedIn={setIsLoggedIn} setUsername={setUsername} />} />
          </Routes>
        </Box>
        {isLoggedIn && (
          <AppBar position="static" component="footer" color="primary" elevation={0}>
            <Toolbar sx={{ justifyContent: 'center' }}>
              <Typography variant="body2" color="inherit">
                Logged in as: {username}
              </Typography>
            </Toolbar>
          </AppBar>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;
