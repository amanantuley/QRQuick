'use server';
/**
 * @fileOverview A simple URL shortener.
 *
 * - shortenUrl - A function that "shortens" a URL.
 * - ShortenUrlInput - The input type for the shortenUrl function.
 * - ShortenUrlOutput - The return type for the shortenUrl function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ShortenUrlInputSchema = z.object({
  url: z.string().url().describe('The URL to shorten.'),
});
export type ShortenUrlInput = z.infer<typeof ShortenUrlInputSchema>;

const ShortenUrlOutputSchema = z.object({
  shortUrl: z.string().url().describe('The shortened URL.'),
});
export type ShortenUrlOutput = z.infer<typeof ShortenUrlOutputSchema>;

export async function shortenUrl(input: ShortenUrlInput): Promise<ShortenUrlOutput> {
  return shortenUrlFlow(input);
}

const shortenUrlFlow = ai.defineFlow(
  {
    name: 'shortenUrlFlow',
    inputSchema: ShortenUrlInputSchema,
    outputSchema: ShortenUrlOutputSchema,
  },
  async (input) => {
    try {
      const response = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(input.url)}`);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      const shortUrl = await response.text();
      // is.gd can return an error message in the body on failure.
      if (shortUrl.startsWith('Error:')) {
        throw new Error(shortUrl);
      }
      return { shortUrl };
    } catch (error) {
      console.error('Failed to shorten URL with is.gd:', error);
      throw new Error('There was a problem shortening the URL. Please try again.');
    }
  }
);
