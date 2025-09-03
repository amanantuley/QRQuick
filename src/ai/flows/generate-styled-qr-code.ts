'use server';
/**
 * @fileOverview Generates a styled QR code from a URL with customizable colors.
 *
 * - generateStyledQrCode - A function that generates a styled QR code.
 * - GenerateStyledQrCodeInput - The input type for the generateStyledQrCode function.
 * - GenerateStyledQrCodeOutput - The return type for the generateStyledQrCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import QRCodeSVG from 'qrcode-svg';

const GenerateStyledQrCodeInputSchema = z.object({
  url: z.string().url().describe('The URL to encode in the QR code.'),
  colorDark: z.string().regex(/^#[0-9A-Fa-f]{6}$/).describe('The color of the dark modules, as a hex code (e.g. #000000).'),
  colorLight: z.string().regex(/^#[0-9A-Fa-f]{6}$/).describe('The color of the light modules, as a hex code (e.g. #FFFFFF).'),
});
export type GenerateStyledQrCodeInput = z.infer<typeof GenerateStyledQrCodeInputSchema>;

const GenerateStyledQrCodeOutputSchema = z.object({
  svg: z.string().describe('The QR code as an SVG string.'),
});
export type GenerateStyledQrCodeOutput = z.infer<typeof GenerateStyledQrCodeOutputSchema>;

export async function generateStyledQrCode(input: GenerateStyledQrCodeInput): Promise<GenerateStyledQrCodeOutput> {
  return generateStyledQrCodeFlow(input);
}

const generateStyledQrCodeFlow = ai.defineFlow(
  {
    name: 'generateStyledQrCodeFlow',
    inputSchema: GenerateStyledQrCodeInputSchema,
    outputSchema: GenerateStyledQrCodeOutputSchema,
  },
  async input => {
    // Generate the QR code as an SVG string using qrcode-svg library.
    const qrCode = new QRCodeSVG({
      content: input.url,
      color: input.colorDark,
      background: input.colorLight,
      ecl: 'M', // Error Correction Level
      width: 256,
      height: 256,
      padding: 0,
      join: true,
      container: 'svg-viewbox',
    });

    const svg = qrCode.svg();
    return {svg};
  }
);
