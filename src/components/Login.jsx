import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TextField, Button, Grid, Typography, Container, Paper } from '@mui/material';
import config from '../config';

function Login({ setIsLoggedIn, setUsername: setUsernameProp }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${config.serverUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('username', data.user.username);
        localStorage.setItem('userId', data.user.id);
        setIsLoggedIn(true);
        setUsernameProp(data.user.username);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
        console.error('Login failed:', data.error);
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error(error);
    }
  };

  return (
    <Container
      component="main"
      maxWidth="xs"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        padding: { xs: 3, md: 4 },
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'background.paper',
          width: '100%',
          maxWidth: '400px', // Added a maximum width for better centering
        }}
      >
        <Typography component="h1" variant="h5" color="primary" gutterBottom>
          Sign in
        </Typography>
        <form onSubmit={handleSubmit} sx={{ width: '100%', mt: 1 }}>
          <Grid container spacing={2} direction="column">
            <Grid item xs={12}>
              <TextField
                label="Username"
                variant="outlined"
                fullWidth
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Grid>
            <Grid item>
              <TextField
                label="Password"
                variant="outlined"
                type="password"
                fullWidth
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Grid>
            {error && (
              <Grid item>
                <Typography color="error">{error}</Typography>
              </Grid>
            )}
            <Grid item>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 2, mb: 2 }}
              >
                Sign In
              </Button>
            </Grid>
            <Grid item>
              <Typography variant="body2" align="center" sx={{ display: 'block' }}>
                Don't have an account? <Link to="/signup" style={{ textDecoration: 'none' }}>Sign up</Link>
              </Typography>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default Login;
