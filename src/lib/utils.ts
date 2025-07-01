import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// File and data utilities

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date in a readable format
 */
export function formatDate(date: Date | string): string {
	const d = new Date(date);
	return d.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
	return Math.random().toString(36).substr(2, 9);
}

/**
 * Validate file type
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
	const extension = file.name.split('.').pop()?.toLowerCase();
	return allowedTypes.includes(extension || '');
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File, maxSize: number): boolean {
	return file.size <= maxSize;
}

/**
 * Parse CSV content
 */
export function parseCSV(content: string): string[][] {
	const lines = content.split('\n');
	return lines
		.filter(line => line.trim() !== '')
		.map(line => line.split(',').map(cell => cell.trim()));
}

/**
 * Convert array to CSV string
 */
export function arrayToCSV(data: string[][]): string {
	return data.map(row => row.join(',')).join('\n');
}

// Function utilities

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: ReturnType<typeof setTimeout>;
	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

/**
 * Sleep function for async operations
 */
export function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// UI and formatting utilities

/**
 * Calculate job progress percentage
 */
export function calculateProgress(processed: number, total: number): number {
	if (total === 0) return 0;
	return Math.round((processed / total) * 100);
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: string): string {
	switch (status) {
		case 'completed':
			return 'text-green-600 bg-green-100';
		case 'running':
			return 'text-blue-600 bg-blue-100';
		case 'failed':
			return 'text-red-600 bg-red-100';
		case 'pending':
			return 'text-yellow-600 bg-yellow-100';
		case 'cancelled':
			return 'text-gray-600 bg-gray-100';
		default:
			return 'text-gray-600 bg-gray-100';
	}
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength) + '...';
}

// Validation utilities

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

// Language utilities

/**
 * Get language name from code
 */
export function getLanguageName(code: string): string {
	const languages: Record<string, string> = {
		'en': 'English',
		'es': 'Spanish',
		'fr': 'French',
		'de': 'German',
		'it': 'Italian',
		'pt': 'Portuguese',
		'ru': 'Russian',
		'zh': 'Chinese',
		'ja': 'Japanese',
		'ko': 'Korean',
		'ar': 'Arabic',
		'hi': 'Hindi',
		'da': 'Danish',
		'pl': 'Polish'
	};
	return languages[code] || code;
}

/**
 * Get all supported languages as options for dropdowns
 */
export function getLanguageOptions(): Array<{ code: string; name: string }> {
	const languages: Record<string, string> = {
		'en': 'English',
		'es': 'Spanish',
		'fr': 'French',
		'de': 'German',
		'it': 'Italian',
		'pt': 'Portuguese',
		'ru': 'Russian',
		'zh': 'Chinese',
		'ja': 'Japanese',
		'ko': 'Korean',
		'ar': 'Arabic',
		'hi': 'Hindi',
		'da': 'Danish',
		'pl': 'Polish'
	};
	
	return Object.entries(languages)
		.map(([code, name]) => ({ code, name }))
		.sort((a, b) => a.name.localeCompare(b.name));
} 