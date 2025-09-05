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

const WifiSchema = z.object({
  type: z.literal('wifi'),
  ssid: z.string().describe('The name of the Wi-Fi network (SSID).'),
  password: z.string().describe('The password for the Wi-Fi network.'),
  encryption: z.enum(['WPA', 'WEP', 'nopass']).describe('The encryption type of the Wi-Fi network.'),
});

const UrlSchema = z.object({
  type: z.literal('url'),
  url: z.string().url().describe('The URL to encode in the QR code.'),
});

const GenerateStyledQrCodeInputSchema = z.union([WifiSchema, UrlSchema]);
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
    let content = '';
    if (input.type === 'url') {
      content = input.url;
    } else if (input.type === 'wifi') {
      // Format for Wi-Fi QR codes: WIFI:T:<encryption>;S:<ssid>;P:<password>;;
      const encryption = input.encryption === 'nopass' ? 'nopass' : input.encryption;
      content = `WIFI:T:${encryption};S:${input.ssid};P:${input.password};;`;
    }

    const qrCode = new QRCodeSVG({
      content: content,
      color: '#ffffff',
      background: '#000000',
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
