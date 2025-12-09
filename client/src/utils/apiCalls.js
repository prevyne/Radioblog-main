import axios from "axios";

// Use relative `/api` by default so front-end requests are proxied in development
// Set `REACT_APP_API_URL` to a full backend URL in production if needed.
// Both client and admin call the same server backend API.
const DEFAULT_SERVER_RENDER = "https://radioblog-mai.onrender.com";
export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production" ? `${DEFAULT_SERVER_RENDER}/api` : "/api");

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    if (!config.headers.Authorization) {
      try {
        if (typeof window !== "undefined") {
          const stored =
            localStorage.getItem("masenoAuthState") || localStorage.getItem("userInfo");
          if (stored) {
            const auth = JSON.parse(stored);
            const token = auth?.token;
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          }
        }
      } catch {
        // ignore storage errors
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const extractErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong. Please try again.";

export const setAuthHeader = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const emailSignUp = async (payload) => {
  try {
    const { data } = await api.post("/auth/signup", payload);
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error("Email Sign-Up failed:", message);
    return { success: false, message };
  }
};

export const emailSignIn = async (payload) => {
  try {
    const { data } = await api.post("/auth/login", payload);
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error("Email Sign-In failed:", message);
    return { success: false, message };
  }
};

const googleAuth = async (accessToken) => {
  try {
    const { data } = await api.post("/auth/google", { access_token: accessToken });
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error("Google authentication failed:", message);
    return { success: false, message };
  }
};

export const getGoogleSignIn = googleAuth;
export const getGoogleSignUp = googleAuth;

export const fetchCurrentUser = async (token) => {
  try {
    const { data } = await api.get("/auth/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    return { success: false, message };
  }
};

export const fetchPosts = async (params = {}) => {
  try {
    const { data } = await api.get("/posts", { params });
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error("Fetching posts failed:", message);
    return { success: false, message };
  }
};

export const fetchPostById = async (postId) => {
  try {
    const { data } = await api.get(`/posts/${postId}`);
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error("Fetching post failed:", message);
    return { success: false, message };
  }
};

export const fetchComments = async (postId) => {
  try {
    const { data } = await api.get(`/posts/comments/${postId}`);
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error("Fetching comments failed:", message);
    return { success: false, message };
  }
};

export const createComment = async (postId, payload, token) => {
  try {
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined;
    const { data } = await api.post(`/posts/comment/${postId}`, payload, config);
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error("Creating comment failed:", message);
    return { success: false, message };
  }
};

export const deleteComment = async (postId, commentId, token) => {
  try {
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined;
    const { data } = await api.delete(`/posts/comment/${commentId}/${postId}`, config);
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error("Deleting comment failed:", message);
    return { success: false, message };
  }
};

export const fetchPopularContent = async () => {
  try {
    const { data } = await api.get("/posts/popular");
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error("Fetching popular content failed:", message);
    return { success: false, message };
  }
};

export const logShare = async (postId, payload = {}) => {
  try {
    const { data } = await api.post(`/posts/share/${postId}`, payload);
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error('Logging share failed:', message);
    return { success: false, message };
  }
};

export const likePost = async (postId) => {
  try {
    const { data } = await api.post(`/posts/like/${postId}`);
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error('Liking post failed:', message);
    return { success: false, message };
  }
};

export const unlikePost = async (postId) => {
  try {
    const { data } = await api.post(`/posts/unlike/${postId}`);
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error('Unliking post failed:', message);
    return { success: false, message };
  }
};

export const fetchBanners = async () => {
  try {
    const { data } = await api.get('/posts/banners');
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error('Fetching banners failed:', message);
    return { success: false, data: [], message };
  }
};

export const fetchCategories = async () => {
  try {
    const { data } = await api.get('/categories');
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error('Fetching categories failed:', message);
    return { success: false, message };
  }
};

export const adminCreateCategory = async (payload, token) => {
  try {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    const { data } = await api.post('/admin/categories', payload, config);
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error('Creating category failed:', message);
    return { success: false, message };
  }
};

export const adminDeleteCategory = async (id, token) => {
  try {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    const { data } = await api.delete(`/admin/categories/${id}`, config);
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error('Deleting category failed:', message);
    return { success: false, message };
  }
};

export const adminUpdateCategory = async (id, payload, token) => {
  try {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    const { data } = await api.patch(`/admin/categories/${id}`, payload, config);
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error('Updating category failed:', message);
    return { success: false, message };
  }
};

export const fetchUserById = async (userId) => {
  try {
    const { data } = await api.get(`/users/get-user/${userId}`);
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error("Fetching user failed:", message);
    return { success: false, message };
  }
};

export const updateUser = async (payload, token) => {
  try {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    // send to /users/update for authenticated self-update
    const { data } = await api.patch(`/users/update`, payload, config);
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error("Updating user failed:", message);
    return { success: false, message };
  }
};

export const requestPasswordReset = async () => {
  try {
    const { data } = await api.post('/users/reset-password');
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error('Request password reset failed:', message);
    return { success: false, message };
  }
};

export const adminResetPassword = async (userId, token) => {
  try {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    const { data } = await api.post(`/admin/users/${userId}/reset-password`, {}, config);
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error('Admin reset password failed:', message);
    return { success: false, message };
  }
};

export const fetchWriterById = async (userId) => {
  try {
    const { data } = await api.get(`/users/writer/${userId}`);
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error("Fetching writer failed:", message);
    return { success: false, message };
  }
};

export const followWriter = async (writerId) => {
  try {
    const { data } = await api.post(`/users/follow/${writerId}`);
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error("Following writer failed:", message);
    return { success: false, message };
  }
};

export const unfollowWriter = async (writerId) => {
  try {
    const { data } = await api.delete(`/users/follow/${writerId}`);
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error("Unfollowing writer failed:", message);
    return { success: false, message };
  }
};

export const uploadImage = async (file) => {
  try {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post(`/storage/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error("Image upload failed:", message);
    return { success: false, message };
  }
};

export const resetPasswordComplete = async (payload) => {
  try {
    const { data } = await api.post('/auth/reset-password-complete', payload);
    return data;
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error('Completing password reset failed:', message);
    return { success: false, message };
  }
};