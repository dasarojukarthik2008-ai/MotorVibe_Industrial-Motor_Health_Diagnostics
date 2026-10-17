/**
 * API client with automatic cookie handling and error normalization
 */
const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, config);
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error('Unable to connect to the backend. Start the MotorVibe development servers and try again.');
    }
    throw err;
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : {};

  if (!response.ok) {
    const proxyUnavailable = response.status >= 500 && !contentType.includes('application/json');
    const error = new Error(
      data.message
      || (proxyUnavailable
        ? 'Unable to connect to the backend. Start the backend server and try again.'
        : `Request failed with status ${response.status}.`)
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const authApi = {
  login: (identifier, password) => request('/auth/login', { method: 'POST', body: { identifier, password } }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),
};

export const motorsApi = {
  getAll: () => request('/motors'),
  getById: (id) => request(`/motors/${id}`),
  create: (motor) => request('/motors', { method: 'POST', body: motor }),
};

export const testsApi = {
  start: (payload) => request('/tests/start', { method: 'POST', body: payload }),
  stop: (id) => request(`/tests/${id}/stop`, { method: 'POST' }),
  finish: (id) => request(`/tests/${id}/finish`, { method: 'POST' }),
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') searchParams.append(k, v);
    });
    const qs = searchParams.toString();
    return request(`/tests${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => request(`/tests/${id}`),
  getTelemetry: (id) => request(`/tests/${id}/telemetry`),
  compare: (firstId, secondId) => request(`/tests/compare?firstId=${firstId}&secondId=${secondId}`),
};

export const dashboardApi = {
  getSummary: () => request('/dashboard/summary'),
  getHardwareStatus: (motorId) => request(`/hardware/status${motorId ? `?motorId=${motorId}` : ''}`),
  getHealth: () => request('/health'),
};
