"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, RefreshCw, Check } from "lucide-react";

export function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const password = useMemo(() => {
    let chars = "";
    if (uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
    if (numbers) chars += "0123456789";
    if (symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
    if (!chars) return "";

    let result = "";
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    return result;
  }, [length, uppercase, lowercase, numbers, symbols, refreshKey]);

  const generatePassword = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const copyPassword = async () => {
    if (password) {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const strength = getStrength(password);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generated Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <div className="p-4 bg-muted rounded-lg font-mono text-lg break-all pr-12">
              {password || "Enable at least one option"}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={copyPassword}
              disabled={!password}
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Strength:</span>
            <Badge variant={strength.color}>{strength.label}</Badge>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${strength.barColor}`}
                style={{ width: `${strength.percent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Length: {length}</Label>
            </div>
            <Slider value={[length]} onValueChange={([v]) => setLength(v)} min={4} max={64} step={1} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>4</span>
              <span>64</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label htmlFor="uppercase" className="cursor-pointer">Uppercase (A-Z)</Label>
              <Switch id="uppercase" checked={uppercase} onCheckedChange={setUppercase} />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label htmlFor="lowercase" className="cursor-pointer">Lowercase (a-z)</Label>
              <Switch id="lowercase" checked={lowercase} onCheckedChange={setLowercase} />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label htmlFor="numbers" className="cursor-pointer">Numbers (0-9)</Label>
              <Switch id="numbers" checked={numbers} onCheckedChange={setNumbers} />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label htmlFor="symbols" className="cursor-pointer">Symbols (!@#$)</Label>
              <Switch id="symbols" checked={symbols} onCheckedChange={setSymbols} />
            </div>
          </div>

          <Button onClick={generatePassword} className="w-full" size="lg">
            <RefreshCw className="h-4 w-4 mr-2" /> Generate New Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function getStrength(password: string): { label: string; color: "destructive" | "secondary" | "default" | "outline"; barColor: string; percent: number } {
  if (!password) return { label: "None", color: "secondary", barColor: "bg-gray-300", percent: 0 };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { label: "Weak", color: "destructive", barColor: "bg-red-500", percent: 25 };
  if (score <= 4) return { label: "Fair", color: "outline", barColor: "bg-yellow-500", percent: 50 };
  if (score <= 5) return { label: "Strong", color: "default", barColor: "bg-green-500", percent: 75 };
  return { label: "Very Strong", color: "default", barColor: "bg-emerald-500", percent: 100 };
}