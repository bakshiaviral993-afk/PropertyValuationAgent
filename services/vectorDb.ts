
import { GoogleGenAI } from "@google/genai";
import { REAL_ESTATE_KNOWLEDGE_BASE } from "../data/knowledgeBase";

interface VectorDocument {
    text: string;
    vector: number[];
}

// In-memory cache for the vector database
let cachedDb: VectorDocument[] | null = null;

export class VectorService {
    /**
     * Resiliently creates a new AI client instance.
     * We initialize this per-request or lazily to ensure it uses the latest process.env values.
     */
    private createClient(): GoogleGenAI {
        const apiKey = process.env.API_KEY;
        if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
            const errorMsg = "VectorService: API_KEY is missing from environment.";
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
        return new GoogleGenAI({ apiKey });
    }

    private async getEmbedding(text: string): Promise<number[]> {
        try {
            const ai = this.createClient();
            // Using text-embedding-004 model for high-quality embeddings
            const response = await ai.models.embedContent({
                model: 'text-embedding-004',
                contents: text
            });
            return response.embedding?.values || [];
        } catch (error) {
            console.warn("Embedding generation failed, falling back to empty vector.", error);
            return [];
        }
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length || a.length === 0) return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    // Initialize and index the knowledge base
    async init() {
        if (cachedDb) return;
        
        const docs: VectorDocument[] = [];
        console.log("QuantCore: Starting vector space indexing...");
        
        // Create embeddings for all documents in the knowledge base
        const promises = REAL_ESTATE_KNOWLEDGE_BASE.map(async (text) => {
            const vector = await this.getEmbedding(text);
            if (vector.length > 0) {
                docs.push({ text, vector });
            }
        });
        
        await Promise.all(promises);
        cachedDb = docs;
        console.log(`Vector DB Initialized with ${cachedDb.length} nodes.`);
    }

    async search(query: string, k: number = 3): Promise<string[]> {
        // Ensure DB is initialized
        if (!cachedDb) await this.init();
        if (!cachedDb || cachedDb.length === 0) return []; 

        const queryVector = await this.getEmbedding(query);
        if (queryVector.length === 0) return [];

        const scored = cachedDb.map(doc => ({
            text: doc.text,
            score: this.cosineSimilarity(queryVector, doc.vector)
        }));

        // Sort by similarity score descending
        scored.sort((a, b) => b.score - a.score);
        
        // Return top k texts
        return scored.slice(0, k).map(s => s.text);
    }
}

export const vectorService = new VectorService();
