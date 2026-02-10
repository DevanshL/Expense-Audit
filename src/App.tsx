import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { router } from './router';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
