import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

if (
  !globalThis.localStorage ||
  typeof globalThis.localStorage.setItem !== "function"
) {
  const store = new Map<string, string>();

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    },
  });
}

beforeEach(() => {
  if (!globalThis.localStorage) return;

  if (typeof globalThis.localStorage.clear === "function") {
    globalThis.localStorage.clear();
    return;
  }

  if (typeof globalThis.localStorage.removeItem === "function") {
    globalThis.localStorage.removeItem("turnity_auth_session");
    globalThis.localStorage.removeItem("turnity_token");
  }
});
