export const categoryCacheKey = "panavisos-categories-v1";

const retryDelays = [0, 650, 1700];

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export function readCachedCategories() {
  if (typeof window === "undefined") return [];

  try {
    const saved = JSON.parse(window.localStorage.getItem(categoryCacheKey) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    window.localStorage.removeItem(categoryCacheKey);
    return [];
  }
}

export function writeCachedCategories(categories) {
  if (typeof window === "undefined" || !Array.isArray(categories) || !categories.length) return;

  try {
    window.localStorage.setItem(categoryCacheKey, JSON.stringify(categories));
  } catch {
    // The page can continue with the in-memory response when storage is unavailable.
  }
}

export async function fetchCategoriesWithRetry() {
  let lastError = new Error("No se pudieron cargar las categorías.");

  for (const delay of retryDelays) {
    if (delay) await wait(delay);

    try {
      const response = await fetch("/api/categories", { cache: "no-store" });
      if (!response.ok) throw new Error(`Categories request failed: ${response.status}`);

      const payload = await response.json();
      if (!Array.isArray(payload.categories)) throw new Error("Invalid categories response");

      writeCachedCategories(payload.categories);
      return payload.categories;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}
