// services.js - Enhanced API service layer
const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://127.0.0.1:5000/api";

// Custom error class with response details
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Token management utilities
export const getAuthToken = () => localStorage.getItem("token");
export const setAuthToken = (token) => localStorage.setItem("token", token);
export const clearAuthToken = () => localStorage.removeItem("token");

// Core request function with enhanced capabilities
async function request(
  path,
  { method = "GET", body, params, headers = {}, ...options } = {}
) {
  // Build URL with query parameters
  let url = API_BASE + path;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Configure request options
  const requestOptions = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...options,
  };

  // Add authorization header if token exists
  const token = getAuthToken();
  if (token) {
    requestOptions.headers.Authorization = `Bearer ${token}`;
  }

  // Handle body data (JSON or FormData)
  if (body) {
    if (body instanceof FormData) {
      requestOptions.body = body;
      delete requestOptions.headers["Content-Type"];
    } else {
      requestOptions.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(url, requestOptions);
    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(
        responseData?.message || response.statusText,
        response.status,
        responseData
      );
    }

    return responseData;
  } catch (error) {
    // Handle specific error cases
    if (error.name === "ApiError") throw error;
    
    // Network errors or other issues
    throw new ApiError(
      error.message || "Network request failed",
      0,
      null
    );
  }
}

// --- User API ---
const user = {
  getMe: () => request("/user/me"),
  update: (data) => request("/user/update", { method: "PATCH", body: data }),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return request("/user/avatar", { method: "POST", body: formData });
  },
  delete: () => request("/user/delete", { method: "DELETE" }),
  getAll: () => request("/user/"),
  getById: (id) => request(`/user/${id}`),
  count: () => request("/user/count"),
  countByRole: () => request("/user/count/by-role"),
  countByStatus: () => request("/user/count/by-status"),
  listByStatus: (status) => request(`/user/list/${status}`),
  changeStatus: (userId, status, days) =>
    request(`/user/status/${userId}`, {
      method: "PATCH",
      body: { status, days },
    }),
  changeRole: (userId, role) =>
    request(`/user/role/${userId}`, { method: "PATCH", body: { role } }),
  promote: (userId) => request(`/user/${userId}/promote`, { method: "PUT" }),
  demote: (userId) => request(`/user/${userId}/demote`, { method: "PUT" }),
  unban: (userId) => request(`/user/${userId}/unban`, { method: "PUT" }),
  unsuspend: (userId) =>
    request(`/user/${userId}/unsuspend`, { method: "PUT" }),
  deleteByAdmin: (userId) =>
    request(`/user/delete/${userId}`, { method: "DELETE" }),
  welcome: () => request("/user/welcome"),
};


// --- Auth API ---
const auth = {
  register: (userData) => request("/auth/register", { method: "POST", body: userData }),
  login: (credentials) => request("/auth/login", { method: "POST", body: credentials }),
  logout: () => {
    clearAuthToken();
    return request("/auth/logout");
  },
  forgotPassword: (email) =>
    request("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (token, newPassword) =>
    request("/auth/reset-password", {
      method: "POST",
      body: { token, new_password: newPassword },
    }),
  googleLogin: () => (window.location.href = `${API_BASE}/auth/google/login`),
};

// --- Table API ---
const table = {
  create: (data) => request("/table/tables", { method: "POST", body: data }),
  getAll: () => request("/table/tables"),
  get: (id) => request(`/table/tables/${id}`),
  update: (id, data) =>
    request(`/table/tables/${id}`, { method: "PUT", body: data }),
  delete: (id) => request(`/table/tables/${id}`, { method: "DELETE" }),
  changeStatus: (id, status) =>
    request(`/table/tables/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),
  getAvailable: () => request("/table/tables/available"),
  stats: () => request("/table/status"),
  reserved: () => request("/table/reserved"),
  occupied: () => request("/table/occupied"),
  myReservations: () => request("/table/my-reservations"),
  myOccupied: () => request("/table/my-occupied"),
  myTables: () => request("/table/my-tables"),
  myTableByReservation: (reservationId) =>
    request(`/table/my-tables/${reservationId}`),
};

// --- Reservation API ---
const reservation = {
  create: (data) => request("/reservations", { method: "POST", body: data }),
  getAll: (params) => request("/reservations", { params }),
  get: (id) => request(`/reservations/${id}`),
  update: (id, data) =>
    request(`/reservations/${id}`, { method: "PUT", body: data }),
  delete: (id) => request(`/reservations/${id}`, { method: "DELETE" }),
  changeStatus: (id, status) =>
    request(`/reservations/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),
  checkAvailability: (data) =>
    request("/reservations/check-availability", { method: "POST", body: data }),
  upcoming: (params) => request("/reservations/upcoming", { params }),
};

// --- Payment API ---
const payment = {
  getAll: () => request("/payments"),
  get: (id) => request(`/payments/${id}`),
  create: (data) => request("/payments", { method: "POST", body: data }),
  update: (id, data) =>
    request(`/payments/${id}`, { method: "PUT", body: data }),
  adjust: (id, adjustment) =>
    request(`/payments/${id}/adjust`, { method: "POST", body: adjustment }),
  delete: (id) => request(`/payments/${id}`, { method: "DELETE" }),
};

// --- Notification API ---
const notification = {
  getAll: (params) => request("/notifications", { params }),
  unreadCount: () => request("/notifications/unread-count"),
  markRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () =>
    request("/notifications/mark-all-read", { method: "PATCH" }),
  create: (data) => request("/notifications", { method: "POST", body: data }),
  delete: (id) => request(`/notifications/${id}`, { method: "DELETE" }),
};

// --- Menu API ---
const menu = {
  getCategories: () => request("/menu/categories"),
  getCategory: (id) => request(`/menu/categories/${id}`),
  createCategory: (data) =>
    request("/menu/categories", { method: "POST", body: data }),
  updateCategory: (id, data) =>
    request(`/menu/categories/${id}`, { method: "PUT", body: data }),
  deleteCategory: (id) =>
    request(`/menu/categories/${id}`, { method: "DELETE" }),

  getItems: (params) => request("/menu/items", { params }),
  getItem: (id) => request(`/menu/items/${id}`),
  createItem: (data) => request("/menu/items", { method: "POST", body: data }),
  updateItem: (id, data) =>
    request(`/menu/items/${id}`, { method: "PUT", body: data }),
  deleteItem: (id) => request(`/menu/items/${id}`, { method: "DELETE" }),

  getOrders: (params) => request("/menu/orders", { params }),
  getOrder: (id) => request(`/menu/orders/${id}`),
  createOrder: (data) =>
    request("/menu/orders", { method: "POST", body: data }),
  updateOrder: (id, data) =>
    request(`/menu/orders/${id}`, { method: "PUT", body: data }),
  deleteOrder: (id) => request(`/menu/orders/${id}`, { method: "DELETE" }),

  getOrderItems: (params) => request("/menu/order-items", { params }),
  getOrderItem: (id) => request(`/menu/order-items/${id}`),
  createOrderItem: (data) =>
    request("/menu/order-items", { method: "POST", body: data }),
  updateOrderItem: (id, data) =>
    request(`/menu/order-items/${id}`, { method: "PUT", body: data }),
  deleteOrderItem: (id) =>
    request(`/menu/order-items/${id}`, { method: "DELETE" }),
};

// Central API export
const api = {
  user,
  auth,
  table,
  reservation,
  payment,
  notification,
  menu,
  
  // Expose core utilities
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  ApiError,
};

export default api;