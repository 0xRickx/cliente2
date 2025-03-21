import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#007bff', // Blue primary color
    },
    secondary: {
      main: '#ffffff', // White secondary color
    },
    background: {
      default: '#f0f0f0', // Light gray background
      paper: '#ffffff', // White paper background
    },
    text: {
      primary: '#333333', // Dark gray text
      secondary: '#777777', // Light gray text
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

export default theme;