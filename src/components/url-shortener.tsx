"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { shortenUrl } from "@/ai/flows/shorten-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check } from "lucide-react";

const urlShortenerSchema = z.object({
  url: z.string().min(1, { message: "URL cannot be empty." }).url({ message: "Please enter a valid URL." }),
});

type UrlShortenerFormValues = z.infer<typeof urlShortenerSchema>;

export function UrlShortener() {
  const [isPending, startTransition] = useTransition();
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const form = useForm<UrlShortenerFormValues>({
    resolver: zodResolver(urlShortenerSchema),
    defaultValues: {
      url: "",
    },
  });

  const onSubmit = (values: UrlShortenerFormValues) => {
    setShortUrl(null);
    setIsCopied(false);
    startTransition(async () => {
      try {
        const result = await shortenUrl({ url: values.url });
        setShortUrl(result.shortUrl);
      } catch (error) {
        console.error("URL shortening failed:", error);
        let description = "Failed to shorten URL. Please try again.";
        if (error instanceof Error && error.message.includes('is.gd')) {
            description = error.message;
        }
        toast({
          title: "Error",
          description,
          variant: "destructive",
        });
      }
    });
  };

  const handleCopy = () => {
    if (!shortUrl) return;
    navigator.clipboard.writeText(shortUrl).then(() => {
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: "The shortened URL has been copied to your clipboard.",
      });
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <Card className="w-full overflow-hidden shadow-2xl shadow-primary/10 transition-all duration-300">
      <CardContent className="p-6 sm:p-8">
        <h3 className="text-2xl font-semibold tracking-tight">Shorten a Long URL</h3>
        <p className="mt-2 text-muted-foreground">Enter a long URL to create a shortened version.</p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/very/long/url" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Shorten URL
            </Button>
          </form>
        </Form>
        
        {(isPending || shortUrl) && (
          <div className="mt-8">
            <h4 className="font-semibold">Your Shortened URL</h4>
            <div className="mt-2 flex w-full items-center space-x-2">
                {isPending ? (
                     <div className="flex items-center text-muted-foreground w-full">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Generating short URL...</span>
                    </div>
                ) : shortUrl ? (
                    <>
                    <Input value={shortUrl} readOnly className="flex-1" />
                    <Button onClick={handleCopy} variant="outline" size="icon">
                        {isCopied ? <Check /> : <Copy />}
                    </Button>
                    </>
                ) : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
