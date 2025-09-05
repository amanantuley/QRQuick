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
import { Loader2, Download, RefreshCw, ZoomIn, ZoomOut, Link, Wifi } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const qrCodeSchema = z.object({
  type: z.enum(["url", "wifi"]),
  url: z.string().optional(),
  ssid: z.string().optional(),
  password: z.string().optional(),
  encryption: z.enum(["WPA", "WEP", "nopass"]).optional(),
}).refine(data => {
    if (data.type === 'url') {
      return !!data.url && z.string().url().safeParse(data.url).success;
    }
    return true;
}, {
    message: "Please enter a valid URL.",
    path: ['url'],
}).refine(data => {
    if (data.type === 'wifi') {
        return !!data.ssid;
    }
    return true;
}, {
    message: "Network name cannot be empty.",
    path: ['ssid'],
});


type QRCodeFormValues = z.infer<typeof qrCodeSchema>;

export function QRGenerator() {
  const [isPending, startTransition] = useTransition();
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const { toast } = useToast();

  const form = useForm<QRCodeFormValues>({
    resolver: zodResolver(qrCodeSchema),
    defaultValues: {
      type: "url",
      url: "",
      ssid: "",
      password: "",
      encryption: "WPA",
    },
  });

  const qrType = form.watch("type");

  const onSubmit = (values: QRCodeFormValues) => {
    setQrCodeSvg(null);
    startTransition(async () => {
      try {
        let result;
        if (values.type === 'url' && values.url) {
            result = await generateStyledQrCode({ type: 'url', url: values.url });
        } else if (values.type === 'wifi' && values.ssid) {
            result = await generateStyledQrCode({ type: 'wifi', ssid: values.ssid, password: values.password || '', encryption: values.encryption || 'WPA' });
        } else {
            // Should not happen with validation
            return;
        }
        
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
  
  const handleRegenerate = () => {
    if(form.getValues('url') || form.getValues('ssid')) {
        onSubmit(form.getValues());
    }
  }

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
    <Card className="w-full overflow-hidden border-0 bg-white/5 shadow-2xl shadow-primary/10 transition-all duration-300 backdrop-blur-lg">
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2">
          <div className="p-6 sm:p-8">
            <h3 className="text-2xl font-semibold tracking-tight">Create Your QR Code</h3>
            <p className="mt-2 text-muted-foreground">Generate a QR code for a URL or Wi-Fi network.</p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>QR Code Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.clearErrors();
                            setQrCodeSvg(null); // Clear QR on type change
                          }}
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-4"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                                <div className={`flex w-full items-center rounded-md p-3 transition-colors ${field.value === 'url' ? 'bg-primary/20 border-primary' : 'border border-input'}`}>
                                    <RadioGroupItem value="url" id="url" className="peer sr-only" />
                                    <label htmlFor="url" className="flex items-center gap-3 cursor-pointer">
                                        <Link className="h-5 w-5" />
                                        <span className="font-medium">URL</span>
                                    </label>
                                </div>
                            </FormControl>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                                <div className={`flex w-full items-center rounded-md p-3 transition-colors ${field.value === 'wifi' ? 'bg-primary/20 border-primary' : 'border border-input'}`}>
                                    <RadioGroupItem value="wifi" id="wifi" className="peer sr-only" />
                                    <label htmlFor="wifi" className="flex items-center gap-3 cursor-pointer">
                                        <Wifi className="h-5 w-5" />
                                        <span className="font-medium">Wi-Fi</span>
                                    </label>
                                </div>
                            </FormControl>
                           </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Separator />

                {qrType === 'url' && (
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
                )}
                
                {qrType === 'wifi' && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="ssid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Network Name (SSID)</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Wi-Fi Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Your Network Password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="encryption"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Encryption</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select encryption type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="WPA">WPA/WPA2</SelectItem>
                              <SelectItem value="WEP">WEP</SelectItem>
                              <SelectItem value="nopass">No Password</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}


                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Generate QR Code
                </Button>
              </form>
            </Form>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4 bg-black/20 p-6 sm:p-8 md:border-l">
            <div className={`relative flex aspect-square w-full items-center justify-center rounded-lg bg-card/50 p-4 shadow-inner backdrop-blur-sm transition-all duration-300 ${isZoomed ? 'max-w-[320px] sm:max-w-[512px]' : 'max-w-[256px]'}`}>
              {isPending ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-10 w-10 animate-spin" />
                  <span>Generating...</span>
                </div>
              ) : qrCodeSvg ? (
                <>
                    <div dangerouslySetInnerHTML={{ __html: qrCodeSvg }} className="h-full w-full rounded-md bg-white p-2 transition-all duration-500 ease-in-out transform-gpu scale-100" />
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
                 <Button onClick={handleRegenerate} variant="outline" size="icon" aria-label="Regenerate QR Code" disabled={isPending}>
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
