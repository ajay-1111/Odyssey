import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CurrencyContext = createContext(null);
const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('odyssey_currency') || 'USD';
  });
  const [currencies, setCurrencies] = useState([]);
  const [rates, setRates] = useState({});

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await axios.get(`${API_URL}/currencies`);
        setCurrencies(response.data);
        const rateMap = {};
        response.data.forEach(c => { rateMap[c.code] = c.rate; });
        setRates(rateMap);
      } catch (error) {
        console.error('Failed to fetch currencies');
      }
    };
    fetchCurrencies();
  }, []);

  useEffect(() => {
    localStorage.setItem('odyssey_currency', currency);
  }, [currency]);

  const convertPrice = (amount, fromCurrency = 'USD') => {
    if (!rates[fromCurrency] || !rates[currency]) return amount;
    const usdAmount = amount / rates[fromCurrency];
    return Math.round(usdAmount * rates[currency]);
  };

  const formatPrice = (amount, fromCurrency = 'USD') => {
    const converted = convertPrice(amount, fromCurrency);
    const currencyData = currencies.find(c => c.code === currency);
    const symbol = currencyData?.symbol || currency;
    return `${symbol}${converted.toLocaleString()}`;
  };

  const getSymbol = () => {
    const currencyData = currencies.find(c => c.code === currency);
    return currencyData?.symbol || currency;
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      currencies, 
      convertPrice, 
      formatPrice,
      getSymbol 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};
