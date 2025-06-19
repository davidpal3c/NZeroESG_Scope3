
// export const getBackendUrl = () => {
//   const url = process.env.NEXT_PUBLIC_BACKEND_URL;

//   // Explicit block if undefined in production
//   if (!url) {
//     if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
//       throw new Error("NEXT_PUBLIC_BACKEND_URL is missing in production!");
//     }
//     console.warn("Missing BACKEND_URL, using localhost fallback (dev only).");
//     return "http://localhost:8000";
//   }

//   // Block insecure HTTP in production
//   if (typeof window !== "undefined" && window.location.protocol === "https:" && url.startsWith("http://")) {
//     throw new Error("Backend URL must be HTTPS in production.");
//   }

//   return url;
// };

export const getBackendUrl = () => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    if (typeof window !== "undefined") {
      console.warn("Missing NEXT_PUBLIC_BACKEND_URL, using localhost fallback.");
    }
    return "http://localhost:8000"; // dev only
  }
  return url;
};
