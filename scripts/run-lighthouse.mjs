import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

async function run() {
  const url = process.argv[2];
  if (!url) {
    console.error('URL is required');
    process.exit(1);
  }

  let chrome;
  try {
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'],
    });

    const options = {
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance', 'seo'],
      port: chrome.port,
    };

    const runnerResult = await lighthouse(url, options);

    if (!runnerResult || !runnerResult.lhr) {
      console.log(JSON.stringify(null));
      process.exit(0);
    }

    const data = runnerResult.lhr;
    
    const performanceScore = data.categories?.performance?.score;
    const seoScore = data.categories?.seo?.score;
    const audits = data.audits;
    
    const pageLoadMs = audits?.['speed-index']?.numericValue || audits?.['interactive']?.numericValue || 0;
    const fcp = audits?.['first-contentful-paint']?.numericValue || null;
    const lcp = audits?.['largest-contentful-paint']?.numericValue || null;
    const cls = audits?.['cumulative-layout-shift']?.numericValue || null;

    const result = {
      lighthouse_score: (performanceScore !== undefined && performanceScore !== null) ? Math.round(performanceScore * 100) : 0,
      seo_score: (seoScore !== undefined && seoScore !== null) ? Math.round(seoScore * 100) : 0,
      page_load_ms: Math.round(pageLoadMs),
      core_web_vitals: {
        fcp: fcp ? Math.round(fcp) : null,
        lcp: lcp ? Math.round(lcp) : null,
        cls: cls ? Number(cls.toFixed(3)) : null,
      },
    };

    console.log(JSON.stringify(result));
  } catch (error) {
    console.error('Error running lighthouse:', error);
    process.exit(1);
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}

run();
