import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TripDetailPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const response = await axios.get(`${API_URL}/trips/${tripId}`, {
          headers: getAuthHeader()
        });
        sessionStorage.setItem('generatedTrip', JSON.stringify(response.data));
        navigate('/trip-result');
      } catch (error) {
        toast.error('Trip not found');
        navigate('/dashboard');
      }
    };

    if (tripId) {
      fetchTrip();
    }
  }, [tripId, navigate, getAuthHeader]);

  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ background: 'var(--background)' }}>
      <div className="bg-animated" />
      <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
