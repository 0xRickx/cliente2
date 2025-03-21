import React, { useState, useEffect } from 'react';
import { Button, Grid, Typography, Container, Paper, TextField, FormControl, FormLabel, MenuItem, Box } from '@mui/material';
import config from '../config';
import { useNavigate } from 'react-router-dom';

function EditQuestionnaire({ username, onLogout }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const questionsResponse = await fetch(config.serverUrl + '/api/questionnaire-questions');
        if (!questionsResponse.ok) {
          throw new Error('Failed to fetch questions: ' + questionsResponse.status);
        }
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData);

        const answersResponse = await fetch(config.serverUrl + '/api/dashboard', {
          headers: {
            'Authorization': 'Bearer ' + accessToken,
          },
        });
        if (!answersResponse.ok) {
          if (answersResponse.status === 404) {
            console.log("No existing questionnaire response - initializing empty form");
            const initialAnswers = {};
            questionsData.forEach(question => {
              initialAnswers[question] = null;
              if (question !== 'willingness_to_relocate' && question !== 'willingness_to_change_region' && question !== 'weekend_work_availability' && question !== 'shift_work_availability') {
                initialAnswers[question] = '';
              }
            });
            setAnswers(initialAnswers);
            console.log('answers state after setting (initialAnswers):', initialAnswers);
            return;
          }
         else {
            throw new Error('Failed to fetch answers: ' + answersResponse.status);
          }
        } else {
          const answersData = await answersResponse.json();
          console.log('Fetched answersData:', answersData);
          if (answersData && answersData.questionnaire) {
            setAnswers(answersData.questionnaire);
          } else {
            console.warn('Questionnaire data or questionnaire object is missing in answersData:', answersData);
            setError("Failed to load questionnaire data.");
          }
        }
      } catch (error) {
        console.error("Error fetching ", error);
        setError("Error fetching  " + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleAnswerChange = (event) => {
    setAnswers({
      ...answers,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage('');
    try {
      const response = await fetch(config.serverUrl + '/api/dashboard', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answers),
      });
      if (!response.ok) {
        throw new Error('Failed to update answers: ' + response.status);
      }
      setSuccessMessage('Questionnaire answers updated successfully!');
    } catch (error) {
      console.error("Error submitting answers:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Typography>Loading questionnaire...</Typography>;
  }

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ padding: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Questionnaire Answers
        </Typography>
        {successMessage && (
          <Typography color="success" sx={{ mb: 2 }}>{successMessage}</Typography>
        )}
        <form onSubmit={handleSubmit}>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">Questionnaire</FormLabel>
            <Grid container spacing={3} direction="column" sx={{ mt: 2 }}>
              {questions.map((question) => (
                <Grid item key={question}>
                  {question === 'date_birth' || question === 'earliest_start_date' ? (
                    <TextField
                      label={question}
                      name={question}
                      type="date"
                      variant="outlined"
                      fullWidth
                      value={question === 'date_birth' && answers[question] && !isNaN(Date.parse(answers[question])) ? new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).format(new Date(answers[question])) : answers[question] || ''}
                      onChange={handleAnswerChange}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  ) : (['willingness_to_relocate', 'willingness_to_change_region', 'weekend_work_availability', 'shift_work_availability'].includes(question) ? (
                    <TextField
                      select
                      label={question}
                      name={question}
                      variant="outlined"
                      fullWidth
                      value={answers[question] || ''}
                      onChange={handleAnswerChange}
                    >
                      <MenuItem value={true}>True</MenuItem>
                      <MenuItem value={false}>False</MenuItem>
                    </TextField>
                  ) : (
                    <TextField
                      label={question}
                      name={question}
                      variant="outlined"
                      fullWidth
                      value={answers[question] || ''}
                      onChange={handleAnswerChange}
                    />
                  ))}
                </Grid>
              ))}
            </Grid>
            <Button type="submit" variant="contained" color="primary" sx={{ mt: 3 }}>
              Submit Answers
            </Button>
          </FormControl>
        </form>
        {answers && answers.video_url ? (
          <Box mt={3}>
            <Typography variant="h6">Video Recording</Typography>
            <Typography>
              <a href={`${config.serverUrl}/${answers.video_url}`} target="_blank" rel="noopener noreferrer">
                View Video
              </a>
            </Typography>
          </Box>
        ) : (
          <Box mt={3}>
            <Typography variant="h6">Video Recording</Typography>
            <Typography>No video recorded</Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default EditQuestionnaire;
