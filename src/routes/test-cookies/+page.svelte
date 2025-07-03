<script>
  import { onMount } from 'svelte';
  
  let cookieStatus = 'Not tested yet';
  
  function testCookies() {
    // Set test cookies
    document.cookie = 'sb-access-token=test-access-token; path=/; max-age=3600; SameSite=Lax';
    document.cookie = 'sb-refresh-token=test-refresh-token; path=/; max-age=86400; SameSite=Lax';
    
    // Check if they were set
    const cookies = document.cookie;
    console.log('All cookies:', cookies);
    
    if (cookies.includes('sb-access-token') && cookies.includes('sb-refresh-token')) {
      cookieStatus = '✅ Cookies set successfully!';
    } else {
      cookieStatus = '❌ Cookies failed to set';
    }
  }
  
  function clearCookies() {
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    cookieStatus = 'Cookies cleared';
  }
</script>

<div class="p-8">
  <h1 class="text-2xl font-bold mb-4">Cookie Test Page</h1>
  
  <div class="space-y-4">
    <button 
      on:click={testCookies}
      class="bg-blue-500 text-white px-4 py-2 rounded"
    >
      Test Set Cookies
    </button>
    
    <button 
      on:click={clearCookies}
      class="bg-red-500 text-white px-4 py-2 rounded"
    >
      Clear Cookies
    </button>
    
    <p class="text-lg">{cookieStatus}</p>
    
    <div class="mt-4">
      <h3 class="font-bold">Current Cookies:</h3>
      <pre class="bg-gray-100 p-2 text-sm">{document?.cookie || 'No cookies'}</pre>
    </div>
  </div>
</div> 