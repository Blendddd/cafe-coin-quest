import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuthSimple";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

  useEffect(() => {
    const initVanta = () => {
      try {
        console.log('Initializing Vanta clouds effect...');
        console.log('Window VANTA:', (window as any).VANTA);
        console.log('VANTA.CLOUDS:', (window as any).VANTA?.CLOUDS);
        
        if (vantaRef.current && !vantaEffect.current && (window as any).VANTA && (window as any).VANTA.CLOUDS) {
          vantaEffect.current = (window as any).VANTA.CLOUDS({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            skyColor: 0x6db7d9,
            cloudColor: 0x90a5c5,
            sunColor: 0x311c06,
            sunGlareColor: 0xff3500,
            sunlightColor: 0xff7c00,
            speed: 1.10
          });
          console.log('Vanta clouds effect initialized successfully');
        } else {
          console.log('Vanta not ready yet, retrying...');
          setTimeout(initVanta, 100);
        }
      } catch (error) {
        console.error('Error initializing Vanta effect:', error);
      }
    };

    // Wait a bit for scripts to load, then try to initialize
    const timer = setTimeout(initVanta, 100);

    return () => {
      clearTimeout(timer);
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  return (
    <div ref={vantaRef} className="min-h-screen">
      <div className="relative z-10">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </div>
    </div>
  );
};

export default App;
