import { toast } from "sonner";
import { setAuthHeader, API_BASE_URL } from "./apiCalls";



export function formatNumber (num) {
    if (num > 1000000) {
        return (num / 1000000).toFixed (1) + "M";
    } else if (num >= 1000) {
        return (num / 1000) .toFixed (1) + "K";
    }
        return num.toString ();
    }

    export const saveUserInfo = (authPayload, signIn) => {
        if (authPayload?.token) {
            setAuthHeader(authPayload.token);
        }

        if (typeof signIn === "function") {
            // signIn handles local storage persistence internally.
            signIn(authPayload);
        }

        toast.success(authPayload?.message || "Signed in successfully.");

        setTimeout(() => {
            window.location.replace("/");
        }, 800);
    };

    export const uploadFile = async (setFileURL, file, onProgress) => {
      if (!file) return;

      try {
        onProgress?.(0);
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API_BASE_URL}/storage/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Upload failed: ${res.status} ${res.statusText} ${text}`);
        }

        const data = await res.json();
        setFileURL(data.url);
        onProgress?.(100);
        return data.url;
      } catch (err) {
        console.error("uploadFile error:", err);
        toast.error("Upload failed");
      }
    };
      
    


