export const getBackendUrl = () => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    if (typeof window !== "undefined") {
      return `${window.location.protocol}//${window.location.hostname}:8000`;
    }
    return process.env.NEXT_PUBLIC_BACKEND_URL || "http://backend:8000";
    // return "http://localhost:8000"; // dev only
  }
  return url;
};
