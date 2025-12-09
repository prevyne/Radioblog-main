// Uploads are routed through the server API; do NOT call Supabase directly from React.

// Default to relative `/api` so admin requests start with /api and will be proxied in dev.
// Override with `REACT_APP_API_URL` for production/back-end URL. If running in
// production and `REACT_APP_API_URL` is not set, default to the Render service URL.
// NOTE: include `/api` so `API_URI` resolves to the server's `/api` namespace in production.
const DEFAULT_RENDER_API = "https://radioblog-mai.onrender.com/api";
export const API_URI =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production" ? DEFAULT_RENDER_API : "/api");

export const uploadFile = async (file, { onProgress } = {}) => {
  if (!file) throw new Error("No file provided");

  // Upload via server endpoint only. Server will forward to Supabase using service key.
  try {
    onProgress?.(0);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URI}/storage/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Upload failed: ${res.status} ${res.statusText} ${text}`);
    }

    const data = await res.json();
    onProgress?.(100);
    return data.url;
  } catch (err) {
    console.error("uploadFile error:", err);
    throw err;
  }
};

export function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }

  return num.toString();
}

export function getInitials(fullName) {
  const names = fullName.split(" "); //code wave asante

  const initials = names.slice(0, 2).map((name) => name[0].toUpperCase());

  const initialsStr = initials.join("");

  return initialsStr;
}

export function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove non-word characters
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

export const updateURL = ({ page, navigate, location }) => {
  const params = new URLSearchParams();

  if (page && page > 1) {
    params.set("page", page);
  }

  const newURL = `${location.pathname}?${params.toString()}`;
  navigate(newURL, { replace: true });

  return newURL;
};
