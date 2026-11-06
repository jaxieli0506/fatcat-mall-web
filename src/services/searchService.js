import axios from 'axios';

const API_URL = 'https://localhost:7017/api/search';

export function searchAll(keyword) {
  return axios.get(`${API_URL}?keyword=${encodeURIComponent(keyword)}`);
} 