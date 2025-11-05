import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RefreshCw, X } from "lucide-react";

// Import hook - akan di-resolve oleh Vite saat build
import { useRegisterSW } from "virtual:pwa-register/react";

export const PWAUpdatePrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      // eslint-disable-next-line no-console
      console.log("SW Registered: ", r);
    },
    onRegisterError(error: Error) {
      // eslint-disable-next-line no-console
      console.log("SW registration error", error);
    },
  });

  useEffect(() => {
    if (needRefresh || offlineReady) {
      setShowPrompt(true);
    }
  }, [needRefresh, offlineReady]);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShowPrompt(false);
  };

  const update = async () => {
    await updateServiceWorker(true);
    close();
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm animate-in slide-in-from-bottom-5">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {offlineReady ? "Aplikasi Siap Offline" : "Update Tersedia"}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={close}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-sm">
            {offlineReady
              ? "Aplikasi siap digunakan secara offline."
              : "Versi baru aplikasi tersedia. Update sekarang untuk mendapatkan fitur terbaru."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            {needRefresh && (
              <Button onClick={update} className="flex-1" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Update
              </Button>
            )}
            <Button
              onClick={close}
              variant="outline"
              size="sm"
              className={needRefresh ? "" : "w-full"}
            >
              {offlineReady ? "Tutup" : "Nanti"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
