import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export interface PageSpeedMetrics {
  lighthouse_score: number;
  seo_score: number;
  page_load_ms: number;
  core_web_vitals: {
    fcp: number | null;
    lcp: number | null;
    cls: number | null;
  };
}

export async function fetchPageSpeedMetrics(url: string): Promise<PageSpeedMetrics | null> {
  try {
    console.info(`[PageSpeed] Starting external Lighthouse script for: ${url}`);
    
    // Resolve path to the script
    const scriptPath = path.join(process.cwd(), 'scripts', 'run-lighthouse.mjs');
    
    // Run the script as a separate node process
    const { stdout, stderr } = await execAsync(`node ${scriptPath} "${url}"`, {
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer just in case
    });

    if (stderr) {
      console.warn(`[PageSpeed] Script stderr (may just be warnings):`, stderr.substring(0, 500));
    }

    // The script should output a single line of JSON at the very end
    const outputLines = stdout.trim().split('\n');
    const jsonStr = outputLines[outputLines.length - 1];
    
    if (jsonStr === 'null') {
      return null;
    }

    const data = JSON.parse(jsonStr) as PageSpeedMetrics;
    return data;
  } catch (error) {
    console.error(`[PageSpeed] Failed external Lighthouse script for ${url}:`, error);
    return null;
  }
}
