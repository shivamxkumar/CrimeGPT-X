import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
export function formatCurrency(n: number) { return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n) }
export function formatDate(d: string) { return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) }
export function formatDateTime(d: string) { return new Date(d).toLocaleString('en-IN') }
// Case IDs (e.g. "CC/2026/0002") contain slashes, which would otherwise split
// across multiple path segments in a single dynamic route like /cases/[id].
export function caseHref(caseId: string) { return `/cases/${encodeURIComponent(caseId)}` }
