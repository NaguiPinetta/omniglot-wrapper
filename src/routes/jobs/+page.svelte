<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { jobStore } from '../../stores/jobs';
	import { agentStore } from '../../stores/agents';
	import { datasetStore } from '../../stores/datasets';
	import { glossaryStore } from '../../stores/glossary';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { getLanguageOptions } from '$lib/utils';
	import { logger } from '$lib/utils/logger';
	import type { JobFormData, Job } from '../../types/jobs';
	import type { PageData } from './$types';

	export let data: PageData;

	let showModal = false;
	let formData: JobFormData = {
		name: '',
		description: '',
		agent_id: '',
		dataset_id: '',
		glossary_id: '',
		glossary_usage_mode: 'prefer',
		source_language: 'en',
		translation_instructions: '',
		target_language: ''
	};

	// Column mapping state
	let selectedDatasetPreview: any[] = [];
	let availableColumns: string[] = [];
	let selectedDataset: any = null;
	let columnMapping = {
		source_text_column: '',
		source_language_column: '',
		row_id_column: ''
	};
	let loadingPreview = false;

	// Polling interval for job list refresh
	let pollingInterval: NodeJS.Timeout;

	// Initialize stores with server data
	onMount(() => {
		if (data.jobs) jobStore.set({ jobs: data.jobs, loading: false, error: data.error || null });
		if (data.agents) agentStore.set({ agents: data.agents, loading: false, error: null });
		if (data.datasets) datasetStore.set({ datasets: data.datasets, loading: false, error: null });
		// Load glossaries for job creation
		glossaryStore.loadEntries();
		// Immediately fetch jobs on mount
		jobStore.loadJobs();
		// Set up polling every 30 seconds instead of 5
		pollingInterval = setInterval(() => {
			jobStore.loadJobs();
		}, 30000);
	});

	onDestroy(() => {
		clearInterval(pollingInterval);
	});

	async function handleSubmit() {
		// Validate required column mapping
		if (!columnMapping.source_text_column) {
			alert('Please select a Source Text Column');
			return;
		}
		
		// Validate at least one target language
		if (!formData.target_language) {
			alert('Please select a target language.');
			return;
		}
		
		// Get the selected agent's prompt
		const selectedAgent = $agentStore.agents.find(a => a.id === formData.agent_id);
		const agentPrompt = selectedAgent?.prompt || '';
		
		// Combine agent prompt with user instructions
		let finalInstructions = agentPrompt;
		if (formData.translation_instructions) {
			finalInstructions += '\n\nAdditional Instructions: ' + formData.translation_instructions;
		}
		
		// Create enhanced job data with column mapping
		const enhancedJobData = {
			...formData,
			glossary_id: formData.glossary_id || null, // Ensure empty string becomes null
			translation_instructions: finalInstructions,
			column_mapping: columnMapping,
			glossary_usage_mode: formData.glossary_usage_mode as 'prefer' | 'enforce' | 'ignore'
		};
		
		if (!formData.name || formData.name.trim() === '') {
			alert('Please enter a job name.');
			return;
		}
		
		try {
			await jobStore.addJob(enhancedJobData);
			
			if ($jobStore.error) {
				alert(`Failed to create job: ${$jobStore.error}`);
			} else {
				resetForm();
				showModal = false;
			}
		} catch (error: any) {
			alert(`Failed to create job: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	function resetForm() {
		formData = {
			name: '',
			description: '',
			agent_id: '',
			dataset_id: '',
			glossary_id: '',
			glossary_usage_mode: 'prefer',
			source_language: 'en',
			translation_instructions: '',
			target_language: ''
		};
		
		// Reset column mapping
		columnMapping = {
			source_text_column: '',
			source_language_column: '',
			row_id_column: ''
		};
		
		selectedDatasetPreview = [];
		availableColumns = [];
	}

	function openModal() {
		resetForm();
		showModal = true;
	}

	function getStatusColor(status: Job['status']) {
		switch (status) {
			case 'pending': return 'bg-yellow-100 text-yellow-800';
			case 'queued': return 'bg-yellow-100 text-yellow-800'; // Support legacy status
			case 'running': return 'bg-blue-100 text-blue-800';
			case 'completed': return 'bg-green-100 text-green-800';
			case 'failed': return 'bg-red-100 text-red-800';
			case 'cancelled': return 'bg-gray-100 text-gray-800';
			case 'paused': return 'bg-orange-100 text-orange-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getAgentName(id: string) {
		return $agentStore.agents.find(a => a.id === id)?.custom_name || 'Unknown Agent';
	}

	function getDatasetName(id: string) {
		return $datasetStore.datasets.find(d => d.id === id)?.name || 'Unknown Dataset';
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString();
	}

	let showResultsModal = false;
	let selectedJobResults: any[] = [];
	let selectedJobName = '';
	let selectedJobSkippedRows: any[] = [];
	let showSkippedRows = false;

	async function viewResults(jobId: string) {
		try {
			// For viewing results, we'll limit to a reasonable number for UI performance
			// but use the paginated approach for large jobs
			const { getJobResults } = await import('../../lib/jobs/api');
			
			// Check job size first
			const job = $jobStore.jobs.find(j => j.id === jobId);
			const processedItems = job?.processed_items || 0;
			
			logger.debug('Loading results for view modal:', { jobId, processedItems });
			
			// For large jobs, fetch a limited sample for the modal
			if (processedItems > 1000) {
				logger.debug('Large job detected, fetching limited sample for modal view');
				selectedJobResults = await getJobResults(jobId); // This already limits to 6000 rows
				
				// Show a warning if we're displaying a subset
				if (selectedJobResults.length >= 5999) {
					logger.warn('Displaying limited results in modal for large job');
				}
			} else {
				selectedJobResults = await getJobResults(jobId);
			}
			
			selectedJobName = job?.name || 'Unknown Job';
			
			// Load skipped rows from job record (if any)
			selectedJobSkippedRows = job?.skipped_rows || [];
			
			logger.debug('Results loaded for modal:', { 
				jobId, 
				resultsCount: selectedJobResults.length,
				skippedCount: selectedJobSkippedRows.length 
			});
			
			showResultsModal = true;
		} catch (error: any) {
			logger.error('Failed to load job results', error);
			alert(`Failed to load results: ${error.message}`);
		}
	}

	async function downloadResults(jobId: string) {
		const jobLogger = logger.scope('DownloadResults');
		jobLogger.debug('Starting download for job', { jobId });
		
		try {
			// Run diagnostics first to understand the data situation
			const { diagnoseJobResults, getCompleteJobResults } = await import('../../lib/jobs/api');
			
			jobLogger.debug('Running job diagnostics...');
			await diagnoseJobResults(jobId);
			
			// Use the new paginated download function for large jobs
			const results = await getCompleteJobResults(jobId);
			jobLogger.debug('Job results fetched', { resultsCount: results.length });
			
			const job = $jobStore.jobs.find(j => j.id === jobId);
			const dataset = $datasetStore.datasets.find(d => d.id === job?.dataset_id);
			
			if (!job || !dataset) {
				jobLogger.error('Job or dataset not found', { jobFound: !!job, datasetFound: !!dataset });
				alert('Job or dataset not found. Please refresh the page and try again.');
				return;
			}

			// Log job size information for debugging
			const processedItems = job.processed_items || 0;
			const totalItems = job.total_items || 0;
			jobLogger.info('Job download details:', {
				jobId,
				processedItems,
				totalItems,
				actualResultsCount: results.length,
				jobStatus: job.status
			});

			// Check for potential data discrepancies and alert user
			if (processedItems > 0 && results.length !== processedItems) {
				const discrepancy = processedItems - results.length;
				jobLogger.warn('Data discrepancy detected:', {
					processedItems,
					actualResultsCount: results.length,
					difference: discrepancy
				});
				
				// Alert user about the discrepancy
				const userConfirm = confirm(
					`Data discrepancy detected!\n\n` +
					`Expected: ${processedItems} translations\n` +
					`Found: ${results.length} translations\n` +
					`Missing: ${discrepancy} translations\n\n` +
					`This might indicate incomplete job processing or database issues.\n` +
					`Do you want to continue with the download of available results?`
				);
				
				if (!userConfirm) {
					jobLogger.debug('User cancelled download due to discrepancy');
					return;
				}
			}

			// Continue with existing download logic...
			if (dataset.file_type === 'xml') {
				// Download the original XML content
				const { XMLParser, XMLBuilder } = await import('fast-xml-parser');
				const parser = new XMLParser({ ignoreAttributes: false });
				const builder = new XMLBuilder({ ignoreAttributes: false, suppressEmptyNode: false, format: true });
				// Fetch the original file_content from the dataset API (in case it's not loaded)
				let fileContent = dataset.file_content;
				if (!fileContent) {
					const { getDataset } = await import('../../lib/datasets/api');
					const ds = await getDataset(dataset.id);
					fileContent = ds.file_content;
				}
				fileContent = fileContent || '';
				const xml = parser.parse(fileContent);
				// Build a map of translations by row_id, but only for valid, non-empty row_ids
				const translationMap = Object.fromEntries(results.filter(r => r.row_id && typeof r.row_id === 'string').map(r => [r.row_id, r.target_text]));
				// Update only the Value attribute for each ResourceEntry that exists in the original XML
				if (xml.wGlnWirelessResourceDocument && xml.wGlnWirelessResourceDocument.ResourceEntry) {
					let entries = xml.wGlnWirelessResourceDocument.ResourceEntry;
					if (!Array.isArray(entries)) entries = [entries];
					for (let i = 0; i < entries.length; i++) {
						const entry = entries[i];
						const id = entry['@_ID'];
						if (id && Object.prototype.hasOwnProperty.call(translationMap, id)) {
							// Sanitize translation value: remove line breaks and stray XML markup
							let safeValue = translationMap[id];
							if (typeof safeValue === 'string') {
								safeValue = safeValue.replace(/[\r\n]+/g, ' ').replace(/<[^>]+>/g, '');
							}
							// Ensure entry is a plain object with only attributes
							entries[i] = {
								'@_ID': entry['@_ID'],
								'@_Value': safeValue,
								'@_SuggestedLength': entry['@_SuggestedLength'],
								// Copy any other attributes
								...Object.fromEntries(Object.entries(entry).filter(([k]) => !['@_ID','@_Value','@_SuggestedLength'].includes(k) && k.startsWith('@_')))
							};
						}
					}
					jobLogger.debug('ResourceEntry structure processed', { entriesCount: entries.length });
					// If it was a single entry, restore as object
					if (xml.wGlnWirelessResourceDocument.ResourceEntry && !Array.isArray(xml.wGlnWirelessResourceDocument.ResourceEntry) && entries.length === 1) {
						xml.wGlnWirelessResourceDocument.ResourceEntry = entries[0];
					} else {
						xml.wGlnWirelessResourceDocument.ResourceEntry = entries;
					}
				}
				let xmlContent = builder.build(xml);
				// Optionally decode XML entities for quotes/apostrophes
				xmlContent = xmlContent.replace(/&quot;/g, '"').replace(/&apos;/g, "'");
				jobLogger.debug('XML content generated', { contentLength: xmlContent.length });
				const blob = new Blob([xmlContent], { type: 'application/xml' });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
				a.download = `${job.name || 'job'}_translated.xml`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
			} else {
				// Export as CSV using translation results from database
				const Papa = (await import('papaparse')).default;
				
				jobLogger.debug('Processing CSV download', { jobId, resultsCount: results.length });
				
				if (!results || results.length === 0) {
					alert('No translation results found for this job.');
					return;
				}

				// Filter only completed translations
				const completedTranslations = results.filter(r => r.status === 'completed' && r.target_text);
				
				if (completedTranslations.length === 0) {
					alert('No completed translations found for this job.');
					return;
				}

				jobLogger.debug('Completed translations filtered', { completedCount: completedTranslations.length });

				// Create CSV data with proper headers
				const csvData = completedTranslations.map(result => ({
					'Row ID': result.row_id || '',
					'Source Text': result.source_text || '',
					'Target Text': result.target_text || '',
					'Source Language': result.source_language || '',
					'Target Language': result.target_language || '',
					'Confidence': result.confidence ? (result.confidence * 100).toFixed(1) + '%' : '95.0%',
					'Status': result.status || 'completed',
					'Created At': result.created_at ? new Date(result.created_at).toLocaleString() : ''
				}));

				const csvContent = Papa.unparse(csvData, { 
					delimiter: ',',
					header: true
				});
				
				// Prepend UTF-8 BOM for Excel compatibility
				const BOM = '\uFEFF';
				const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `${job.name || 'job'}_translations.csv`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);
				
				jobLogger.info('CSV download completed', { translationsCount: completedTranslations.length });
			}
		} catch (error) {
			jobLogger.error('Download failed', error);
			alert(`Failed to download results: ${error.message}. Check console for details.`);
		}
	}

	async function retryJob(jobId: string) {
		const job = $jobStore.jobs.find(j => j.id === jobId);
		if (!job) {
			logger.error('Job not found in store:', jobId);
			alert('Job not found. Please refresh the page and try again.');
			return;
		}

		try {
			// Reset the job to pending status and clear error
			await jobStore.updateJob(jobId, {
				status: 'pending',
				error: null,
				progress: 0,
				processed_items: 0,
				failed_items: 0,
				started_at: null,
				completed_at: null
			});
			logger.info(`Job ${jobId} successfully reset for retry`);
		} catch (error: any) {
			logger.error('Failed to retry job:', error);
			
			// Provide more specific error messages
			let errorMessage = 'Failed to retry job';
			if (error.message?.includes('PGRST116')) {
				errorMessage = 'Job not found or access denied. The job may have been deleted.';
			} else if (error.message?.includes('JWT')) {
				errorMessage = 'Authentication expired. Please log out and log back in.';
			} else if (error.message) {
				errorMessage = `Failed to retry job: ${error.message}`;
			}
			
			alert(errorMessage);
		}
	}

	async function loadDatasetPreview(datasetId: string) {
		const previewLogger = logger.scope('DatasetPreview');
		previewLogger.debug('Loading preview for dataset', { datasetId });
		
		if (!datasetId) {
			previewLogger.debug('No dataset ID provided, clearing preview');
			return;
		}

		loadingPreview = true;
		
		try {
			// Get the selected dataset to check its file type
			selectedDataset = $datasetStore.datasets.find(d => d.id === datasetId);
			previewLogger.debug('Found dataset', { dataset: selectedDataset?.name, fileType: selectedDataset?.file_type });
			
			if (!selectedDataset) {
				throw new Error('Dataset not found in store');
			}
			
			// Use the same API endpoint as the test function
			const response = await fetch(`/api/datasets/${datasetId}/preview`);
			if (!response.ok) {
				throw new Error(`Failed to get dataset preview: ${response.status}`);
			}
			
			const previewData = await response.json();
			previewLogger.debug('Dataset preview API result', { previewData });
			
			// Handle the correct API response format: {headers, rows, rowCount, totalRows}
			if (previewData.error) {
				throw new Error(previewData.error);
			}
			
			selectedDatasetPreview = previewData.rows || [];
			availableColumns = previewData.headers || [];
			
			previewLogger.debug('Loaded dataset preview', { 
				rowsCount: selectedDatasetPreview.length, 
				columnsCount: availableColumns.length, 
				fileType: selectedDataset?.file_type 
			});
			
		} catch (error: any) {
			previewLogger.warn('API preview failed, using fallback', { error: error.message });
			
			// Fallback: try to parse the dataset content directly
			try {
				if (selectedDataset?.file_content) {
					previewLogger.debug('Using fallback dataset parsing');
					
					if (selectedDataset.file_type === 'xml') {
						// Parse XML
						const { XMLParser } = await import('fast-xml-parser');
						const parser = new XMLParser({ ignoreAttributes: false });
						const xml = parser.parse(selectedDataset.file_content);
						
						let rows: any[] = [];
						if (xml.wGlnWirelessResourceDocument && xml.wGlnWirelessResourceDocument.ResourceEntry) {
							const entries = Array.isArray(xml.wGlnWirelessResourceDocument.ResourceEntry)
								? xml.wGlnWirelessResourceDocument.ResourceEntry
								: [xml.wGlnWirelessResourceDocument.ResourceEntry];
							rows = entries.map((entry: any) => ({
								key: entry['@_ID'] || '',
								value: entry['@_Value'] || ''
							}));
						}
						
						selectedDatasetPreview = rows.slice(0, 10); // First 10 rows
						availableColumns = ['key', 'value'];
						previewLogger.debug('XML fallback successful', { totalRows: rows.length, previewRows: 10 });
						
					} else {
						// Parse CSV
						const Papa = (await import('papaparse')).default;
						const parsed = Papa.parse(selectedDataset.file_content, { header: true });
						const rows = (parsed.data as Record<string, string>[]).filter(row =>
							Object.values(row).some(value => value !== null && value !== undefined && String(value).trim() !== '')
						);
						
						selectedDatasetPreview = rows.slice(0, 10); // First 10 rows
						availableColumns = parsed.meta.fields || [];
						previewLogger.debug('CSV fallback successful', { totalRows: rows.length, previewRows: 10 });
					}
				} else {
					throw new Error('No file content available for fallback parsing');
				}
			} catch (fallbackError: any) {
				previewLogger.error('Fallback parsing failed', fallbackError);
				// Final fallback to empty state
				selectedDatasetPreview = [];
				availableColumns = [];
				selectedDataset = null;
			}
		} finally {
			// ALWAYS reset loading state, regardless of success or failure
			loadingPreview = false;
		}
		
		// Set up column mapping regardless of how we got the preview
		if (availableColumns.length > 0) {
			// Reset column mapping
			columnMapping = {
				source_text_column: '',
				source_language_column: '',
				row_id_column: ''
			};
			
			// Handle XML datasets differently
			if (selectedDataset?.file_type === 'xml') {
				// For XML, we don't need column mapping - it's always key/value
				columnMapping.source_text_column = 'value';
				columnMapping.row_id_column = 'key';
				columnMapping.source_language_column = '';
			} else {
				// For CSV, use intelligent column matching
				const possibleTextColumns = ['text', 'content', 'source_text', 'source', 'message', 'description', 'body'];
				const possibleIdColumns = ['id', 'row_id', 'index', 'number', 'key'];
				const possibleLanguageColumns = ['language', 'lang', 'source_language', 'source_lang', 'locale'];
				
				// Find the best match for source text column
				for (const possible of possibleTextColumns) {
					const match = availableColumns.find(col => col.toLowerCase().includes(possible.toLowerCase()));
					if (match) {
						columnMapping.source_text_column = match;
						break;
					}
				}
				
				// If no match found, use the first column as default
				if (!columnMapping.source_text_column && availableColumns.length > 0) {
					columnMapping.source_text_column = availableColumns[0];
				}
				
				// Find the best match for row ID column
				for (const possible of possibleIdColumns) {
					const match = availableColumns.find(col => col.toLowerCase().includes(possible.toLowerCase()));
					if (match) {
						columnMapping.row_id_column = match;
						break;
					}
				}
				
				// Find the best match for language column
				for (const possible of possibleLanguageColumns) {
					const match = availableColumns.find(col => col.toLowerCase().includes(possible.toLowerCase()));
					if (match) {
						columnMapping.source_language_column = match;
						break;
					}
				}
			}
			
			previewLogger.debug('Column mapping configured', columnMapping);
		}
	}

	// Manual dataset change handler
	function handleDatasetChange() {
		logger.debug('Dataset selection changed', { datasetId: formData.dataset_id });
		if (formData.dataset_id) {
			loadDatasetPreview(formData.dataset_id);
		} else {
			selectedDatasetPreview = [];
			availableColumns = [];
			selectedDataset = null;
			columnMapping = {
				source_text_column: '',
				source_language_column: '',
				row_id_column: ''
			};
		}
	}

	function getPercent(job: Job) {
		return job.total_items > 0 ? Math.round((job.processed_items / job.total_items) * 100) : 0;
	}

	// Add helper to format elapsed time
	function formatElapsed(started: string | null, completed: string | null): string {
		if (!started || !completed) return '';
		const start = new Date(started);
		const end = new Date(completed);
		const ms = end.getTime() - start.getTime();
		if (ms < 0) return '';
		const sec = Math.floor(ms / 1000);
		const min = Math.floor(sec / 60);
		const remSec = sec % 60;
		return min > 0 ? `${min}m ${remSec}s` : `${remSec}s`;
	}

	// Helper function to get unique modules from glossary entries
	function getUniqueModules(entries: any[]) {
		const moduleMap = new Map();
		
		entries.forEach(entry => {
			if (entry.module_id && entry.module_name) {
				if (!moduleMap.has(entry.module_id)) {
					moduleMap.set(entry.module_id, {
						id: entry.module_id,
						name: entry.module_name,
						entryCount: 0,
						languages: new Set()
					});
				}
				const module = moduleMap.get(entry.module_id);
				module.entryCount++;
				if (entry.language) {
					module.languages.add(entry.language);
				}
			}
		});
		
		// Convert languages Set to Array and return modules
		return Array.from(moduleMap.values()).map(module => ({
			...module,
			languages: Array.from(module.languages)
		}));
	}

	async function testJobStart() {
		const testLogger = logger.scope('JobStartTest');
		
		// Find a pending job to test with
		const pendingJob = $jobStore.jobs.find(job => job.status === 'pending');
		
		if (!pendingJob) {
			alert('No pending jobs available to test start functionality');
			return;
		}
		
		try {
			testLogger.debug('Testing job start', { jobId: pendingJob.id, jobName: pendingJob.name });
			await jobStore.startJob(pendingJob.id);
			testLogger.info('Test job start completed successfully');
			
			alert(`Test job start completed for job: ${pendingJob.name}`);
			
		} catch (error: any) {
			testLogger.error('Test job start failed', error);
			alert(`Test job start failed: ${error.message}`);
		}
	}

	async function testJobCreation() {
		const testLogger = logger.scope('JobCreationTest');
		
		try {
			// Test with minimal data
			const testJobData = {
				name: 'DIAGNOSTIC TEST ' + new Date().toISOString(),
				description: 'Test job for debugging',
				agent_id: $agentStore.agents[0]?.id || '',
				dataset_id: $datasetStore.datasets[0]?.id || '',
				glossary_id: '',
				glossary_usage_mode: 'prefer' as const,
				source_language: 'en',
				target_language: 'es',
				translation_instructions: '',
				column_mapping: {
					source_text_column: 'text',
					source_language_column: '',
					row_id_column: ''
				}
			};
			
			testLogger.debug('Test job data prepared', { 
				hasAgent: !!testJobData.agent_id, 
				hasDataset: !!testJobData.dataset_id 
			});
			
			if (!testJobData.agent_id) {
				alert('No agents available for testing');
				return;
			}
			
			if (!testJobData.dataset_id) {
				alert('No datasets available for testing');
				return;
			}
			
			await jobStore.addJob(testJobData);
			testLogger.info('Test job creation completed successfully');
			
			alert('Test job created successfully!');
			
		} catch (error: any) {
			testLogger.error('Test job creation failed', error);
			alert(`Test job creation failed: ${error.message}`);
		}
	}

	async function testDatasetPreview() {
		const testLogger = logger.scope('DatasetPreviewTest');
		
		const dataset = $datasetStore.datasets[0];
		if (!dataset) {
			alert('No datasets available for testing');
			return;
		}
		
		try {
			testLogger.debug('Testing dataset preview', { 
				datasetId: dataset.id,
				fileType: dataset.file_type, 
				fileName: dataset.file_name 
			});
			
			// Get dataset preview
			const response = await fetch(`/api/datasets/${dataset.id}/preview`);
			if (!response.ok) {
				throw new Error(`Failed to get dataset preview: ${response.status}`);
			}
			
			const previewData = await response.json();
			
			// Handle the correct API response format: {headers, rows, rowCount, totalRows}
			if (previewData.error) {
				throw new Error(previewData.error);
			}
			
			const columns = previewData.headers || [];
			const rows = previewData.rows || [];
			
			testLogger.debug('Dataset preview successful', { 
				previewRowsCount: rows.length, 
				columnsCount: columns.length,
				totalRows: previewData.totalRows
			});
			
			alert(`Dataset preview successful! Check console for details.\nColumns: ${columns.join(', ')}\nRows: ${rows.length}/${previewData.totalRows}`);
			
		} catch (error: any) {
			testLogger.error('Dataset preview test failed', error);
			alert(`Dataset preview test failed: ${error.message}`);
		}
	}

	async function testDownload() {
		const testLogger = logger.scope('DownloadTest');
		
		// Find a completed job to test with
		const completedJob = $jobStore.jobs.find(job => job.status === 'completed');
		
		if (!completedJob) {
			alert('No completed jobs available to test download functionality');
			return;
		}
		
		try {
			testLogger.debug('Testing download', { jobId: completedJob.id, jobName: completedJob.name });
			await downloadResults(completedJob.id);
			testLogger.info('Test download completed successfully');
			
		} catch (error: any) {
			testLogger.error('Test download failed', error);
			alert(`Test download failed: ${error.message}`);
		}
	}
</script>

<svelte:head>
	<title>Jobs - Omniglot</title>
</svelte:head>

<main class="container mx-auto px-4 py-8">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-2xl font-bold">Translation Jobs</h1>
		<div class="flex gap-2">
			<Button variant="secondary" on:click={testDownload}>Test Download</Button>
			<Button variant="secondary" on:click={testDatasetPreview}>Test Dataset Preview</Button>
			<Button variant="secondary" on:click={testJobStart}>Test Job Start</Button>
			<Button variant="secondary" on:click={testJobCreation}>Test Job Creation</Button>
			<Button on:click={openModal}>Create Job</Button>
		</div>
	</div>

	<!-- Create Job Modal -->
	{#if showModal}
		<div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" on:click={() => showModal = false}>
			<div class="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" on:click|stopPropagation>
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-xl font-bold">Create New Job</h2>
					<button class="text-gray-500 hover:text-gray-700 text-2xl font-bold" on:click={() => showModal = false}>×</button>
				</div>
				<form on:submit|preventDefault={handleSubmit} class="space-y-4">
					<!-- Job Name Input -->
					<div class="mb-4">
						<label for="job-name" class="block text-sm font-medium mb-1">Job Name</label>
						<input
							id="job-name"
							type="text"
							placeholder="e.g., 'Translate Marketing Copy'"
							bind:value={formData.name}
							required
							minlength="1"
							class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
					</div>
					
					<div>
						<label for="job-description" class="block text-sm font-medium mb-1">Description</label>
						<Textarea
							id="job-description"
							placeholder="A brief description of this translation job."
							bind:value={formData.description}
							rows={2}
						/>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="agent" class="block text-sm font-medium mb-1">Select Agent</label>
							<select
								id="agent"
								bind:value={formData.agent_id}
								class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
								required
							>
								<option value="" disabled>Select an agent</option>
								{#each $agentStore.agents as agent}
									<option value={agent.id}>{agent.custom_name}</option>
								{/each}
							</select>
							{#if $agentStore.agents.length === 0}
								<p class="text-xs text-gray-500 mt-1">No agents available. Create an agent first.</p>
							{/if}
						</div>
						<div>
							<label for="dataset" class="block text-sm font-medium mb-1">Select Dataset</label>
							<select
								id="dataset"
								bind:value={formData.dataset_id}
								on:change={handleDatasetChange}
								class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
								required
							>
								<option value="" disabled>Select a dataset</option>
								{#each $datasetStore.datasets as dataset}
									<option value={dataset.id}>{dataset.name} ({dataset.row_count} rows)</option>
								{/each}
							</select>
							{#if $datasetStore.datasets.length === 0}
								<p class="text-xs text-gray-500 mt-1">No datasets available. Upload a dataset first.</p>
							{/if}
						</div>
					</div>

					<!-- Glossary Selection -->
					<div class="space-y-4 border-t pt-4">
						<h3 class="text-lg font-medium">📚 Glossary Settings</h3>
						
						<div>
							<label for="glossary" class="block text-sm font-medium mb-1">Select Glossary Module</label>
							<select
								id="glossary"
								bind:value={formData.glossary_id}
								class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
							>
								<option value="">None - No glossary</option>
								{#each getUniqueModules($glossaryStore.entries) as module}
									<option value={module.id}>
										{module.name} ({module.entryCount} terms) - {module.languages.join(', ')}
									</option>
								{/each}
							</select>
							{#if $glossaryStore.entries.length === 0}
								<p class="text-xs text-gray-500 mt-1">No glossary entries available. Create glossary entries first.</p>
							{:else}
								<p class="text-xs text-gray-500 mt-1">
									Select a glossary module for consistent terminology. Only terms matching the target language will be used.
								</p>
							{/if}
							{#if $glossaryStore.loading}
								<p class="text-xs text-blue-500 mt-1">Loading glossaries...</p>
							{/if}
							{#if $glossaryStore.error}
								<p class="text-xs text-red-500 mt-1">Error loading glossaries: {$glossaryStore.error}</p>
							{/if}
						</div>

						{#if formData.glossary_id}
						<div>
								<label class="block text-sm font-medium mb-2">Glossary Usage Mode</label>
								<div class="space-y-2">
									<label class="flex items-center space-x-2 cursor-pointer">
										<input
											type="radio"
											bind:group={formData.glossary_usage_mode}
											value="enforce"
											class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
										/>
										<div>
											<span class="text-sm font-medium">🔒 Enforce Strictly</span>
											<p class="text-xs text-gray-500">Must use glossary terms exactly as defined. Fail if terms are not followed.</p>
		</div>
									</label>
									<label class="flex items-center space-x-2 cursor-pointer">
										<input
											type="radio"
											bind:group={formData.glossary_usage_mode}
											value="prefer"
											class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
										/>
					<div>
											<span class="text-sm font-medium">⭐ Prefer When Available</span>
											<p class="text-xs text-gray-500">Use glossary terms when applicable, but allow natural translation otherwise.</p>
										</div>
									</label>
									<label class="flex items-center space-x-2 cursor-pointer">
										<input
											type="radio"
											bind:group={formData.glossary_usage_mode}
											value="ignore"
											class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
										/>
										<div>
											<span class="text-sm font-medium">🚫 Ignore Glossary</span>
											<p class="text-xs text-gray-500">Translate naturally without considering glossary terms.</p>
										</div>
									</label>
								</div>
							</div>
						{/if}
					</div>

					<!-- Column Mapping Section -->
					{#if formData.dataset_id}
						<div class="border-t pt-4">
							{#if selectedDataset?.file_type === 'xml'}
								<!-- XML Dataset Interface -->
								<h3 class="text-lg font-medium mb-3">📄 XML Key/Value Structure</h3>
								<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
									<div class="flex items-start gap-3">
										<div class="text-blue-600 mt-0.5">
											<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
				</div>
				<div>
											<p class="text-sm font-medium text-blue-800">XML Translation Setup</p>
											<p class="text-sm text-blue-700 mt-1">
												XML files use a key/value structure. Each XML entry will be translated automatically:
											</p>
											<ul class="text-sm text-blue-700 mt-2 space-y-1">
												<li>• <strong>Key:</strong> Used as row identifier</li>
												<li>• <strong>Value:</strong> Text to be translated</li>
												<li>• <strong>Output:</strong> Translated value with original key preserved</li>
											</ul>
				</div>
			</div>
			</div>

								<!-- XML Dataset Preview -->
								<div class="mt-4">
									<h4 class="text-sm font-medium mb-2">XML Preview</h4>
									<div class="overflow-x-auto max-h-40 border rounded">
										<table class="min-w-full text-xs">
											<thead class="bg-gray-50">
												<tr>
													<th class="px-2 py-1 text-left font-medium text-gray-500 border-r">
														Key (Row ID)
														<span class="text-orange-600">🆔</span>
													</th>
													<th class="px-2 py-1 text-left font-medium text-gray-500 border-r">
														Value (Source Text)
														<span class="text-blue-600">📝</span>
													</th>
												</tr>
											</thead>
											<tbody>
												{#each selectedDatasetPreview.slice(0, 3) as row}
													<tr class="border-t">
														<td class="px-2 py-1 border-r text-gray-600 max-w-32 truncate" title={row.key}>{row.key}</td>
														<td class="px-2 py-1 border-r text-gray-600 max-w-48 truncate" title={row.value}>{row.value}</td>
													</tr>
												{/each}
											</tbody>
										</table>
									</div>
									<p class="text-xs text-gray-500 mt-1">
										Showing first 3 XML entries. Icons: 🆔 Key (Row ID), 📝 Value (Source Text)
									</p>
								</div>
							{:else}
								<!-- CSV Dataset Interface -->
							<h3 class="text-lg font-medium mb-3">📋 Map CSV Columns</h3>
							
							{#if loadingPreview}
								<p class="text-sm text-gray-500">Loading dataset preview...</p>
							{:else if availableColumns.length === 0}
								<p class="text-sm text-gray-500">No columns detected. Please select a dataset first.</p>
							{:else}
								<div class="grid grid-cols-2 gap-4 mb-4">
									<div>
										<label for="source-text-column" class="block text-sm font-medium mb-1">Source Text Column <span class="text-red-500">*</span></label>
										<select
											id="source-text-column"
											bind:value={columnMapping.source_text_column}
											class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
											required
										>
											<option value="" disabled>Select source text column</option>
											{#each availableColumns as column}
												<option value={column}>{column}</option>
											{/each}
										</select>
									</div>
									<div>
										<label for="row-id-column" class="block text-sm font-medium mb-1">Row ID Column (Optional)</label>
										<select
											id="row-id-column"
											bind:value={columnMapping.row_id_column}
											class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
										>
											<option value="">None</option>
											{#each availableColumns as column}
												<option value={column}>{column}</option>
											{/each}
										</select>
									</div>
									<div>
										<label for="source-language-column" class="block text-sm font-medium mb-1">Source Language Column (Optional)</label>
										<select
											id="source-language-column"
											bind:value={columnMapping.source_language_column}
											class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
										>
											<option value="">Use dropdown selection above</option>
											{#each availableColumns as column}
												<option value={column}>{column}</option>
											{/each}
										</select>
									</div>
								</div>

									<!-- CSV Dataset Preview -->
								<div class="mt-4">
									<h4 class="text-sm font-medium mb-2">Dataset Preview</h4>
									<div class="overflow-x-auto max-h-40 border rounded">
										<table class="min-w-full text-xs">
											<thead class="bg-gray-50">
												<tr>
													{#each availableColumns as column}
														<th class="px-2 py-1 text-left font-medium text-gray-500 border-r">
															{column}
															{#if column === columnMapping.source_text_column}
																<span class="text-blue-600">📝</span>
															{:else if column === columnMapping.source_language_column}
																<span class="text-green-600">🌐</span>
															{:else if column === columnMapping.row_id_column}
																<span class="text-orange-600">🆔</span>
															{/if}
														</th>
													{/each}
												</tr>
											</thead>
											<tbody>
												{#each selectedDatasetPreview.slice(0, 3) as row}
													<tr class="border-t">
														{#each availableColumns as column}
															<td class="px-2 py-1 border-r text-gray-600 max-w-20 truncate">{row[column]}</td>
														{/each}
													</tr>
												{/each}
											</tbody>
										</table>
									</div>
									<p class="text-xs text-gray-500 mt-1">
											Showing first 3 rows. Icons: 📝 Source Text, 🌐 Source Lang, 🆔 Row ID
									</p>
								</div>
								{/if}
							{/if}
						</div>
					{/if}

					<!-- Target Language Single Select -->
					<div class="mb-4">
						<label for="target_language" class="block text-sm font-medium mb-1">Target Language</label>
						<select id="target_language" bind:value={formData.target_language} required class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
							<option value="">Select a language</option>
							{#each getLanguageOptions() as lang}
								<option value={lang.code}>{lang.name} ({lang.code})</option>
							{/each}
						</select>
						<p class="text-xs text-gray-500 mt-1">Select the target language for translation.</p>
					</div>

					<!-- Translation Instructions -->
					<div>
						<label for="translation-instructions" class="block text-sm font-medium mb-1">Additional Translation Instructions (Optional)</label>
						<Textarea
							id="translation-instructions"
							placeholder="e.g., 'Maintain formal tone', 'Preserve technical terminology', 'Adapt for local market'"
							bind:value={formData.translation_instructions}
							rows={2}
						/>
						<p class="text-xs text-gray-500 mt-1">
							<strong>Note:</strong> The selected agent's custom prompt will always be used as the primary instruction. 
							These additional instructions will extend but not replace the agent's base prompt.
						</p>
					</div>

					{#if $jobStore.error}
						<p class="text-red-500 text-sm">Error: {$jobStore.error}</p>
					{/if}

					<!-- Debug Info -->
					<div class="text-xs text-gray-500 p-2 bg-gray-50 rounded">
						Debug: agents={$agentStore.agents.length}, datasets={$datasetStore.datasets.length}, loading={$jobStore.loading}
					</div>

					<div class="flex justify-end gap-2 pt-4">
						<Button type="button" on:click={() => showModal = false}>
							Cancel
						</Button>
						<Button 
							type="submit" 
							disabled={$jobStore.loading || $agentStore.agents.length === 0 || $datasetStore.datasets.length === 0 || !formData.target_language}
						>
							{$jobStore.loading ? 'Creating...' : 'Create Job'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	{#if data.error}
		<Card class="border-red-200 bg-red-50">
			<CardContent class="py-4">
				<p class="text-red-600">Error loading data: {data.error}</p>
			</CardContent>
		</Card>
	{:else if $jobStore.loading && $jobStore.jobs.length === 0}
		<div class="text-center py-8">
			<p>Loading jobs...</p>
		</div>
	{:else if $jobStore.jobs.length === 0}
		<Card>
			<CardContent class="py-12 text-center">
                <h3 class="text-xl font-medium">No jobs found</h3>
				<p class="text-gray-500 mt-2">Create your first translation job to get started.</p>
			</CardContent>
		</Card>
	{:else}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each $jobStore.jobs as job (job.id)}
				<Card class="flex flex-col">
					<CardHeader>
						<div class="flex justify-between items-start gap-4">
							<div class="flex-1">
								<h2 class="text-lg font-bold">{job.name || 'No name'}</h2>
								<p class="text-gray-500 text-sm">{job.description || 'No description'}</p>
							</div>
							<span class="text-xs font-semibold px-2 py-1 rounded-full {getStatusColor(job.status)}">
								{job.status}
							</span>
						</div>
					</CardHeader>
					<CardContent class="flex-grow space-y-4">
						<div>
							<p class="font-medium text-gray-500 text-sm">Agent & Dataset</p>
							<p class="text-sm">{getAgentName(job.agent_id)}</p>
							<p class="text-sm">{getDatasetName(job.dataset_id)}</p>
						</div>
						{#if job.status === 'running' || job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled'}
							<div>
								<p class="font-medium text-gray-500 text-sm">Progress</p>
								<div class="w-full bg-gray-200 rounded-full h-2.5">
									<div class="bg-blue-600 h-2.5 rounded-full" style="width: {getPercent(job)}%"></div>
								</div>
								<p class="text-xs text-gray-500 mt-1">{job.processed_items} / {job.total_items} items ({getPercent(job)}%)</p>
								{#if job.failed_items > 0}
									<p class="text-xs text-red-500">{job.failed_items} failed</p>
								{/if}
							</div>
							<div class="flex flex-row gap-4 mt-2 text-xs text-gray-600 border border-gray-100 rounded px-2 py-1 bg-gray-50">
								{#if job.started_at && job.completed_at}
									<span>Elapsed: {formatElapsed(job.started_at, job.completed_at)}</span>
								{/if}
								{#if job.total_tokens}
									<span>Tokens: {job.total_tokens}</span>
								{/if}
								{#if job.total_cost}
									<span>Cost: ${job.total_cost.toFixed(4)}</span>
								{/if}
							</div>
						{/if}
						{#if job.error}
							<div>
								<p class="font-medium text-gray-500 text-sm">Error</p>
								<p class="text-xs text-red-500">{job.error}</p>
							</div>
						{/if}
					</CardContent>
					<CardFooter class="flex justify-between items-center">
						<div class="text-sm text-gray-500">
							Created {formatDate(job.created_at)}
						</div>
						<div class="flex gap-2">
							{#if job.status === 'pending' || job.status === 'queued'}
								<Button size="sm" on:click={() => jobStore.startJob(job.id)} disabled={$jobStore.loading}>
									Start
								</Button>
							{/if}
							{#if job.status === 'running'}
								<Button variant="secondary" size="sm" on:click={() => jobStore.cancelJob(job.id)} disabled={$jobStore.loading}>
									Cancel
								</Button>
							{/if}
							{#if job.status === 'completed'}
								<Button variant="secondary" size="sm" on:click={() => viewResults(job.id)}>
									View Results
								</Button>
								<Button variant="secondary" size="sm" on:click={() => downloadResults(job.id)}>
									Download
								</Button>
							{/if}
							{#if job.status === 'failed' || job.status === 'cancelled'}
								<Button variant="secondary" size="sm" on:click={() => retryJob(job.id)}>
									Retry
								</Button>
							{/if}
							<Button variant="danger" size="sm" on:click={() => jobStore.deleteJob(job.id)} disabled={$jobStore.loading}>
								Delete
							</Button>
						</div>
					</CardFooter>
				</Card>
			{/each}
		</div>
	{/if}

	<!-- Results Modal -->
	{#if showResultsModal}
		<div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" on:click={() => showResultsModal = false}>
			<div class="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto" on:click|stopPropagation>
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-xl font-bold">Translation Results: {selectedJobName}</h2>
					<button class="text-gray-500 hover:text-gray-700 text-2xl font-bold" on:click={() => showResultsModal = false}>×</button>
				</div>
				
				{#if selectedJobResults.length === 0}
					<p class="text-gray-500">No translation results found.</p>
				{:else}
					<!-- Summary Stats -->
					<div class="grid grid-cols-3 gap-4 mb-6">
						<div class="bg-green-50 border border-green-200 rounded-lg p-4">
							<div class="text-2xl font-bold text-green-600">{selectedJobResults.filter(r => r.status === 'completed').length}</div>
							<div class="text-sm text-green-600">✅ Completed Rows</div>
						</div>
						<div class="bg-red-50 border border-red-200 rounded-lg p-4">
							<div class="text-2xl font-bold text-red-600">{selectedJobResults.filter(r => r.status === 'failed').length}</div>
							<div class="text-sm text-red-600">❌ Failed Rows</div>
						</div>
						<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
							<div class="text-2xl font-bold text-yellow-600">{selectedJobSkippedRows.length}</div>
							<div class="text-sm text-yellow-600">⚠️ Skipped Rows</div>
						</div>
					</div>

					<!-- Completed Results Table -->
					<div class="mb-6">
						<h3 class="text-lg font-medium mb-3">✅ Completed Translations</h3>
						<div class="overflow-x-auto border rounded-lg">
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row ID</th>
										<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Text</th>
										<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Text</th>
										<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Languages</th>
										<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
									</tr>
								</thead>
								<tbody class="bg-white divide-y divide-gray-200">
									{#each selectedJobResults.filter(r => r.status === 'completed') as result}
										<tr>
											<td class="px-4 py-2 text-sm text-gray-500">{result.row_id || 'N/A'}</td>
											<td class="px-4 py-2 text-sm text-gray-900 max-w-xs">
												<div class="truncate" title={result.source_text}>{result.source_text}</div>
											</td>
											<td class="px-4 py-2 text-sm text-gray-900 max-w-xs">
												<div class="truncate" title={result.target_text}>{result.target_text}</div>
											</td>
											<td class="px-4 py-2 text-sm text-gray-500">{result.source_language} → {result.target_language}</td>
											<td class="px-4 py-2 text-sm text-gray-500">{(result.confidence * 100).toFixed(1)}%</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>

					<!-- Skipped Rows Section (Collapsible) -->
					{#if selectedJobSkippedRows.length > 0}
						<div class="mb-6">
							<button 
								class="flex items-center gap-2 text-lg font-medium mb-3 text-yellow-600 hover:text-yellow-700"
								on:click={() => showSkippedRows = !showSkippedRows}
							>
								<span class="transform transition-transform {showSkippedRows ? 'rotate-90' : ''}">▶</span>
								⚠️ Skipped Rows ({selectedJobSkippedRows.length})
							</button>
							
							{#if showSkippedRows}
								<div class="overflow-x-auto border rounded-lg">
									<table class="min-w-full divide-y divide-gray-200">
										<thead class="bg-yellow-50">
											<tr>
												<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
												<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
												<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
											</tr>
										</thead>
										<tbody class="bg-white divide-y divide-gray-200">
											{#each selectedJobSkippedRows as skipped}
												<tr>
													<td class="px-4 py-2 text-sm text-gray-500">{skipped.row_id || `Row ${skipped.row_number}`}</td>
													<td class="px-4 py-2 text-sm">
														{#if skipped.reason && skipped.reason.includes('timed out after 30 seconds')}
															<span class="inline-flex items-center gap-1 text-yellow-700 font-semibold">
																<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
																Timeout: Agent did not respond in 30s
															</span>
														{:else}
															<span class="inline-flex items-center gap-1 text-red-600 font-semibold">
																<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-1.414 1.414A9 9 0 105.636 18.364l1.414-1.414" /></svg>
																{skipped.reason}
															</span>
														{/if}
													</td>
													<td class="px-4 py-2 text-sm text-gray-500 max-w-xs">
														<div class="truncate">{JSON.stringify(skipped.data || {})}</div>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
								<div class="mt-2 text-xs text-yellow-700 flex items-center gap-2">
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
									<span>Timeout means the model/agent did not respond in 30 seconds. Please check that your model endpoint is running and reachable.</span>
								</div>
							{/if}
						</div>
					{/if}
					
					<div class="flex justify-end gap-2">
						<Button variant="secondary" size="sm" on:click={() => showResultsModal = false}>
							Close
						</Button>
						<Button variant="primary" size="sm" on:click={() => downloadResults(selectedJobResults[0]?.job_id)}>
							Download {selectedJobResults[0]?.job_id ? ($datasetStore.datasets.find(d => d.id === $jobStore.jobs.find(j => j.id === selectedJobResults[0]?.job_id)?.dataset_id)?.file_type === 'xml' ? 'XML' : 'CSV') : 'Results'}
						</Button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</main> 