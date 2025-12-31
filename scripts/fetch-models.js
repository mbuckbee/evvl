/**
 * Script to fetch and cache OpenRouter models
 * Run this periodically to update the cached models list
 *
 * Usage: node scripts/fetch-models.js
 */

const fs = require('fs');
const path = require('path');

async function fetchModels() {
  try {
    console.log('Fetching models from OpenRouter...');

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`Fetched ${data.data.length} models`);

    // Save to cache file
    const cachePath = path.join(__dirname, '..', 'lib', 'models-cache.json');
    const cacheData = {
      timestamp: new Date().toISOString(),
      models: data.data,
    };

    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
    console.log(`✓ Cached models to ${cachePath}`);
    console.log(`  Total models: ${data.data.length}`);
    console.log(`  Timestamp: ${cacheData.timestamp}`);

  } catch (error) {
    console.error('Error fetching models:', error);
    process.exit(1);
  }
}

fetchModels();
