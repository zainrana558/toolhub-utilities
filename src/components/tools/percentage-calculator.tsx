"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function PercentageCalculator() {
  // Mode 1: What is X% of Y?
  const [m1Percent, setM1Percent] = useState("");
  const [m1Number, setM1Number] = useState("");
  const [m1Result, setM1Result] = useState<string | null>(null);

  // Mode 2: X is what % of Y?
  const [m2Part, setM2Part] = useState("");
  const [m2Whole, setM2Whole] = useState("");
  const [m2Result, setM2Result] = useState<string | null>(null);

  // Mode 3: Percentage change from X to Y
  const [m3From, setM3From] = useState("");
  const [m3To, setM3To] = useState("");
  const [m3Result, setM3Result] = useState<{ change: number; direction: string } | null>(null);

  const calc1 = () => {
    const p = parseFloat(m1Percent);
    const n = parseFloat(m1Number);
    if (isNaN(p) || isNaN(n)) return;
    setM1Result(((p / 100) * n).toFixed(4).replace(/\.?0+$/, ""));
  };

  const calc2 = () => {
    const part = parseFloat(m2Part);
    const whole = parseFloat(m2Whole);
    if (isNaN(part) || isNaN(whole) || whole === 0) return;
    setM2Result(((part / whole) * 100).toFixed(4).replace(/\.?0+$/, "") + "%");
  };

  const calc3 = () => {
    const from = parseFloat(m3From);
    const to = parseFloat(m3To);
    if (isNaN(from) || isNaN(to) || from === 0) return;
    const change = ((to - from) / Math.abs(from)) * 100;
    const direction = change >= 0 ? "increase" : "decrease";
    setM3Result({ change: Math.abs(change), direction });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="of" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="of">% of Number</TabsTrigger>
          <TabsTrigger value="is">% of What?</TabsTrigger>
          <TabsTrigger value="change">% Change</TabsTrigger>
        </TabsList>

        <TabsContent value="of">
          <Card>
            <CardHeader>
              <CardTitle>What is X% of Y?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-muted-foreground">What is</span>
                <Input type="number" placeholder="25" className="w-24" value={m1Percent} onChange={(e) => setM1Percent(e.target.value)} />
                <span className="text-sm text-muted-foreground">% of</span>
                <Input type="number" placeholder="200" className="w-28" value={m1Number} onChange={(e) => setM1Number(e.target.value)} />
                <span className="text-sm text-muted-foreground">?</span>
              </div>
              <Button onClick={calc1} className="w-full">Calculate</Button>
              {m1Result !== null && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{m1Result}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="is">
          <Card>
            <CardHeader>
              <CardTitle>X is what % of Y?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Input type="number" placeholder="50" className="w-24" value={m2Part} onChange={(e) => setM2Part(e.target.value)} />
                <span className="text-sm text-muted-foreground">is what % of</span>
                <Input type="number" placeholder="200" className="w-28" value={m2Whole} onChange={(e) => setM2Whole(e.target.value)} />
                <span className="text-sm text-muted-foreground">?</span>
              </div>
              <Button onClick={calc2} className="w-full">Calculate</Button>
              {m2Result !== null && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{m2Result}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="change">
          <Card>
            <CardHeader>
              <CardTitle>Percentage Change from X to Y</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From</Label>
                  <Input type="number" placeholder="100" value={m3From} onChange={(e) => setM3From(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>To</Label>
                  <Input type="number" placeholder="150" value={m3To} onChange={(e) => setM3To(e.target.value)} />
                </div>
              </div>
              <Button onClick={calc3} className="w-full">Calculate</Button>
              {m3Result && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">
                    {m3Result.change.toFixed(2).replace(/\.?0+$/, "")}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {m3Result.direction === "increase" ? "Increase" : "Decrease"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Common Percentage Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "10% tip on $50", value: "$5.00" },
              { label: "15% tip on $80", value: "$12.00" },
              { label: "20% of $250", value: "$50.00" },
              { label: "25% off $120", value: "$90.00" },
              { label: "5% of $1000", value: "$50.00" },
              { label: "50% of 88", value: "44" },
              { label: "75% of 200", value: "150" },
              { label: "33.33% of 300", value: "100" },
            ].map((item) => (
              <div key={item.label} className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}