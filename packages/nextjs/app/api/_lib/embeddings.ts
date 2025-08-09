import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cache file path
const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'embeddings.json');

interface EmbeddingCache {
  [hash: string]: number[];
}

// Ensure cache directory exists
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

// Load cache from disk
function loadCache(): EmbeddingCache {
  ensureCacheDir();
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Failed to load embedding cache:', error);
  }
  return {};
}

// Save cache to disk
function saveCache(cache: EmbeddingCache) {
  ensureCacheDir();
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('Failed to save embedding cache:', error);
  }
}

// Create hash for text normalization
function createTextHash(text: string): string {
  const normalized = text.toLowerCase().trim().replace(/\s+/g, ' ');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

// Get embeddings for an array of texts with caching
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for AI matching');
  }

  const cache = loadCache();
  const results: number[][] = [];
  const textsToEmbed: string[] = [];
  const indexMap: number[] = [];

  // Check cache for each text
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    const hash = createTextHash(text);
    
    if (cache[hash]) {
      results[i] = cache[hash];
      console.log(`📋 Cache hit for text: "${text.substring(0, 50)}..."`);
    } else {
      textsToEmbed.push(text);
      indexMap.push(i);
    }
  }

  // Fetch embeddings for uncached texts
  if (textsToEmbed.length > 0) {
    console.log(`🤖 Fetching ${textsToEmbed.length} embeddings from OpenAI...`);
    
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: textsToEmbed,
      });

      // Store results and update cache
      for (let i = 0; i < textsToEmbed.length; i++) {
        const embedding = response.data[i].embedding;
        const originalIndex = indexMap[i];
        const text = textsToEmbed[i];
        const hash = createTextHash(text);
        
        results[originalIndex] = embedding;
        cache[hash] = embedding;
        
        console.log(`✅ Embedded: "${text.substring(0, 50)}..." (${embedding.length} dimensions)`);
      }

      // Save updated cache
      saveCache(cache);
      console.log(`💾 Saved ${textsToEmbed.length} new embeddings to cache`);
      
    } catch (error) {
      console.error('Failed to fetch embeddings from OpenAI:', error);
      throw error;
    }
  }

  return results;
}

// Calculate cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

// Batch similarity calculation
export function calculateSimilarityMatrix(
  embeddings1: number[][],
  embeddings2: number[][]
): number[][] {
  const matrix: number[][] = [];
  
  for (let i = 0; i < embeddings1.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < embeddings2.length; j++) {
      matrix[i][j] = cosineSimilarity(embeddings1[i], embeddings2[j]);
    }
  }
  
  return matrix;
}