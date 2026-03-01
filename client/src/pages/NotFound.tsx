import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-lg mx-4 shadow-lg border border-border bg-card">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/10 rounded-full animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-red-500" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>

          <h2 className="text-xl font-semibold text-foreground mb-4">
            找不到此頁面
          </h2>

          <p className="text-muted-foreground mb-8 leading-relaxed">
            抱歉，您所查詢的頁面不存在。
            <br />
            可能已被移動或刪除。
          </p>

          <Button onClick={() => setLocation("/")} className="px-6">
            <Home className="w-4 h-4 mr-2" />
            返回首頁
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
