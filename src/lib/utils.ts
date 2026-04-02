import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes with clsx */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generate a unique ID for measurement rows */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
