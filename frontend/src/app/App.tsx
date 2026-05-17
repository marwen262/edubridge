import { RouterProvider } from 'react-router';
import { Toaster } from './components/ui/sonner';
import { router } from './routes';
import { AuthProvider } from '@/context/AuthContext';
import ChatbotButton from '@/components/ChatbotButton';

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
      <ChatbotButton />
    </AuthProvider>
  );
}
