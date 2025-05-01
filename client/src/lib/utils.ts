import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as PKR (Pakistani Rupees)
 * @param value The number to format
 * @returns Formatted string in PKR
 */
export function formatPKR(value: number): string {
  return `Rs. ${value.toFixed(2)}`
}
