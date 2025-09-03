"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { generateStyledQrCode } from "@/ai/flows/generate-styled-qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";

const qrCodeSchema = z.object({
  url: z.string().min(1, { message: "URL cannot be empty." }).url({ message: "Please enter a valid URL." }),
  foreground: z.string().regex(/^#[0-9A-Fa-f]{6}$/, { message: "Invalid hex color." }),
  background: z.string().regex(/^#[0-9A-Fa-f]{6}$/, { message: "Invalid hex color." }),
});

type QRCodeFormValues = z.infer<typeof qrCodeSchema>;

const ColorInput = ({ field }: { field: any }) => (
    <div className="relative flex h-10 w-full items-center">
      <Input type="text" {...field} className="pl-12" />
      <div className="absolute left-1 top-1/2 -translate-y-1/2 p-1">
        <input
            type="color"
            className="h-7 w-8 cursor-pointer appearance-none border-none bg-transparent p-0"
            value={field.value}
            onChange={field.onChange}
        />
      </div>
    </div>
);

export function QRGenerator() {
  const [isPending, startTransition] = useTransition();
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const { toast } = useToast();

  const form = useForm<QRCodeFormValues>({
    resolver: zodResolver(qrCodeSchema),
    defaultValues: {
      url: "",
      foreground: "#000000",
      background: "#ffffff",
    },
  });

  const onSubmit = (values: QRCodeFormValues) => {
    setQrCodeSvg(null);
    startTransition(async () => {
      try {
        // Generate the QR code with the original URL
        const result = await generateStyledQrCode({
          url: values.url,
          colorDark: values.foreground,
          colorLight: values.background,
        });
        setQrCodeSvg(result.svg);
      } catch (error) {
        console.error("QR Code generation failed:", error);
        toast({
          title: "Error",
          description: "Failed to generate QR code. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleDownload = () => {
    if (!qrCodeSvg) return;
    
    const scale = 4;
    const size = 256 * scale;
    const svgBlob = new Blob([qrCodeSvg], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(svgUrl);
      
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'qrcode.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        toast({
            title: "Download Error",
            description: "Failed to load SVG for conversion to PNG.",
            variant: "destructive",
        });
    }

    img.src = svgUrl;
  };

  return (
    <Card className="w-full overflow-hidden shadow-2xl shadow-primary/10 transition-all duration-300">
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2">
          <div className="p-6 sm:p-8">
            <h3 className="text-2xl font-semibold tracking-tight">Create Your QR Code</h3>
            <p className="mt-2 text-muted-foreground">Enter a URL and customize the colors.</p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="foreground"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Foreground</FormLabel>
                        <FormControl>
                           <ColorInput field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="background"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Background</FormLabel>
                        <FormControl>
                          <ColorInput field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Generate QR Code
                </Button>
              </form>
            </Form>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4 bg-muted/50 p-6 sm:p-8 border-l">
            <div className={`relative flex aspect-square w-full items-center justify-center rounded-lg bg-card p-4 shadow-inner transition-all duration-300 ${isZoomed ? 'max-w-[320px] sm:max-w-[512px]' : 'max-w-[256px]'}`}>
              {isPending ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-10 w-10 animate-spin" />
                  <span>Generating...</span>
                </div>
              ) : qrCodeSvg ? (
                <>
                    <div dangerouslySetInnerHTML={{ __html: qrCodeSvg }} className="h-full w-full" />
                    <Button onClick={() => setIsZoomed(!isZoomed)} variant="outline" size="icon" className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm">
                        {isZoomed ? <ZoomOut /> : <ZoomIn />}
                    </Button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5h3v3H5zm0 8h3v3H5zm8-8h3v3h-3zm0 8h3v3h-3zm-4 4h.01M13 5h.01M5 13H5.01M17 5c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-2z"/></svg>
                    <span>Your QR code will appear here.</span>
                </div>
              )}
            </div>
            {qrCodeSvg && !isPending && (
              <div className="w-full max-w-[256px] grid grid-cols-[1fr_auto] gap-2">
                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                 <Button onClick={() => form.handleSubmit(onSubmit)()} variant="outline" size="icon" aria-label="Regenerate QR Code" disabled={isPending}>
                    <RefreshCw className="h-4 w-4" />
                 </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
