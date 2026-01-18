import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TripDetailPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const response = await axios.get(`${API_URL}/trips/${tripId}`, {
          headers: getAuthHeader()
        });
        // Store trip and redirect to result page
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
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
