require('dotenv').config();
const cron = require('node-cron');
const axios = require('axios');

// Get URLs from environment variable 
const URLs = process.env.KEEP_ALIVE_URLS 
  ? process.env.KEEP_ALIVE_URLS.split(',') 
  : [];

const CronExpression = {
  EVERY_14_MINUTES: '0 */14 * * * *',
};

// Only run keep-alive in production
if (process.env.NODE_ENV === 'production' && URLs.length > 0) {
  console.log('Keep-alive service started for URLs:', URLs);
  
  cron.schedule(CronExpression.EVERY_14_MINUTES, async () => {
    console.log('Running keep-alive check...');
    await Promise.all(URLs.map((url) => getHealth(url)));
  });
}

async function getHealth(URL) {
  try {
    const res = await axios.get(URL.trim());
    console.log(`Keep-alive successful for ${URL}:`, res.status);
    return res.data;
  } catch (error) {
    console.log(`Keep-alive failed for ${URL}:`, error.message);
  }
}

module.exports = { getHealth };