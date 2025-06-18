export const getBackendUrl = () => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    if (typeof window !== "undefined") {
      console.warn("⚠️ Missing NEXT_PUBLIC_BACKEND_URL, using localhost fallback.");
    }
    return "http://localhost:8000"; // dev only
  }
  return url;
};
// export const getBackendUrl = () => {
//     return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
// };