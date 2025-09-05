import { QrCode, Link, Heart } from 'lucide-react';
import { QRGenerator } from '@/components/qr-generator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UrlShortener } from '@/components/url-shortener';

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background px-4 py-8 sm:px-6 lg:px-8 lg:py-16">
      <div className="flex w-full max-w-6xl flex-col items-center">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-primary/10 p-4 text-primary shadow-lg shadow-primary/20">
            <QrCode className="h-10 w-10" />
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-gradient">
            QRQuick
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground md:text-xl">
            Instantly create and customize QR codes, or shorten long URLs in a snap.
            </p>
        </div>
        <div className="mt-10 w-full max-w-4xl">
          <Tabs defaultValue="qr-generator" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger value="qr-generator">
                <QrCode className="mr-2" />
                QR Code Generator
              </TabsTrigger>
              <TabsTrigger value="url-shortener">
                <Link className="mr-2" />
                URL Shortener
              </TabsTrigger>
            </TabsList>
            <TabsContent value="qr-generator">
              <QRGenerator />
            </TabsContent>
            <TabsContent value="url-shortener">
              <UrlShortener />
            </TabsContent>
          </Tabs>
        </div>
        <footer className="mt-16 flex items-center gap-2 text-center text-sm text-muted-foreground">
            Built with <Heart className="h-4 w-4 text-red-500" /> by Aman Antuley
        </footer>
      </div>
    </main>
  );
}
