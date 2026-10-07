import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const RAM_CACHE_MAX_SIZE = 1000;
const ramCache = new Map();

const CACHE_DIR = process.env.TILE_CACHE_DIR || path.join(os.tmpdir(), 'geoemploi-tile-cache');

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function setRamCache(key, buffer) {
  if (ramCache.size >= RAM_CACHE_MAX_SIZE) {
    const firstKey = ramCache.keys().next().value;
    ramCache.delete(firstKey);
  }
  ramCache.set(key, buffer);
}

/**
 * Récupère une tuile cartographique (RAM -> Disk -> IGN Géoplateforme WMTS)
 * @param {number} z Zoom level (0-21)
 * @param {number} x Tile column
 * @param {number} y Tile row
 * @returns {Promise<{ buffer: Buffer, source: string } | null>}
 */
export async function getTile(z, x, y) {
  const cacheKey = `${z}/${x}/${y}`;

  if (ramCache.has(cacheKey)) {
    return { buffer: ramCache.get(cacheKey), source: 'HIT_RAM' };
  }
  const tileFilePath = path.join(CACHE_DIR, `${z}`, `${x}`, `${y}.png`);
  try {
    const diskBuffer = await fs.readFile(tileFilePath);
    setRamCache(cacheKey, diskBuffer);
    return { buffer: diskBuffer, source: 'HIT_DISK' };
  } catch (_err) {}

  const ignUrl = new URL('https://data.geopf.fr/wmts');
  ignUrl.searchParams.append('SERVICE', 'WMTS');
  ignUrl.searchParams.append('VERSION', '1.0.0');
  ignUrl.searchParams.append('REQUEST', 'GetTile');
  ignUrl.searchParams.append('LAYER', 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2');
  ignUrl.searchParams.append('STYLE', 'normal');
  ignUrl.searchParams.append('TILEMATRIXSET', 'PM');
  ignUrl.searchParams.append('TILEMATRIX', String(z));
  ignUrl.searchParams.append('TILEROW', String(y));
  ignUrl.searchParams.append('TILECOL', String(x));
  ignUrl.searchParams.append('FORMAT', 'image/png');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(ignUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'GeoEmplois-Backend/1.0',
        'Accept': 'image/png,image/*;q=0.8',
      },
    });

    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const tileDirPath = path.join(CACHE_DIR, `${z}`, `${x}`);
    ensureDir(tileDirPath)
      .then(() => fs.writeFile(tileFilePath, buffer))
      .catch((err) => console.error('Failed to write tile to disk cache:', err.message));
    setRamCache(cacheKey, buffer);

    return { buffer, source: 'MISS_IGN' };
  } catch (err) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
