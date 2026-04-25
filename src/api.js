import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

const normalizeUser = (user) => {
  let saved_stocks = [];
  if (user.saved_stocks) {
    if (typeof user.saved_stocks === 'string') {
      try {
        saved_stocks = JSON.parse(user.saved_stocks);
      } catch {
        saved_stocks = [];
      }
    } else if (Array.isArray(user.saved_stocks)) {
      saved_stocks = user.saved_stocks;
    }
  }
  
  return {
    ...user,
    name: user.user_name || user.name,
    email: user.user_email || user.email,
    saved_stocks,
  };
};

export async function signupUser({ name, email, password, date_of_birth }) {
  const payload = {
    user_name: name,
    user_email: email,
    user_password: password,
    date_of_birth,
    saved_stocks: [],
  };

  const response = await client.post('/api/users', payload);
  return normalizeUser(response.data);
}

export async function loginUser({ email, password }) {
  const response = await client.post('/api/auth/login', {
    user_email: email,
    user_password: password,
  });
  return normalizeUser(response.data);
}

export async function fetchSavedStocks(email) {
  const response = await client.get(`/api/users/${encodeURIComponent(email)}`);
  const saved_stocks = response.data.saved_stocks;
  
  if (typeof saved_stocks === 'string') {
    try {
      return JSON.parse(saved_stocks);
    } catch {
      return [];
    }
  }
  
  return Array.isArray(saved_stocks) ? saved_stocks : [];
}

export async function updateSavedStocks(email, savedStocks) {
  const response = await client.post(`/api/users/${encodeURIComponent(email)}/saved-stocks`, {
    saved_stocks: savedStocks,
  });
  return response.data;
}

export async function saveStock(email, stock) {
  const response = await client.post(`/api/users/${encodeURIComponent(email)}/save-stock`, {
    stock,
  });
  return response.data;
}

export async function getRecommendation(symbol) {
  const response = await client.post('/api/recommend', { symbol });
  return response.data;
}

