import React, { useState, useEffect } from 'react';
import { Button, Grid, Typography, Container, Paper, Box } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [videoUrl, setVideoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = {
          'Authorization': `Bearer ${accessToken}`,
        };

        const response = await fetch('/api/dashboard', {
          redirect: 'follow',
          headers: headers,
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Dashboard: HTTP Error Response:', response);
          console.error('Dashboard: HTTP Error Response Text:', errorText);
          throw new Error(`Failed to fetch dashboard data: ${response.status} - ${errorText}`);
        }
        
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setVideoUrl(data.questionnaire.video_address);
        } else {
          const responseText = await response.text();
          console.error('Dashboard: Unexpected Content-Type:', contentType);
          console.error('Dashboard: Raw Response Text:', responseText);
          throw new Error(`Unexpected content type: ${contentType} - ${responseText}`);
        }
      } catch (error) {
        console.error("Dashboard: Error fetching ", error);
        setError("Error fetching dashboard  " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'background.default', minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ padding: 4, backgroundColor: 'background.paper', width: '100%', maxWidth: 'md' }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary" align="center">
          Dashboard Overview
        </Typography>
        <Typography variant="subtitle1" gutterBottom color="textSecondary" align="center">
          Quick access to your interview actions and recent activities.
        </Typography>

        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ padding: 3, textAlign: 'center', backgroundColor: 'background.paper', height: '100%' }}>
              <Typography variant="h6" gutterBottom color="textPrimary">
                Interview Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', justifyContent: 'center', minHeight: 100 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<VideocamIcon />}
                  component="a"
                  href="/interview"
                >
                  Start New Interview
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  component="a"
                  href="/edit-questionnaire"
                >
                  Edit Questionnaire Answers
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default Dashboard;
