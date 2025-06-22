import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// export const baseApiUrl = "https://skylark-entertainment.vercel.app";
export const baseApiUrl = "http://14.187.41.193:5000";

