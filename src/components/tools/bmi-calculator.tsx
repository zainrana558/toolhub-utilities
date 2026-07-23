"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function BMICalculator() {
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [feet, setFeet] = useState("");
  const [inches, setInches] = useState("");
  const [result, setResult] = useState<{ bmi: number; category: string; color: string; advice: string } | null>(null);

  const calculate = () => {
    let bmi = 0;
    if (unit === "metric") {
      const w = parseFloat(weight);
      const hCm = parseFloat(height);
      // Reject empty / NaN / non-positive inputs — previously `parseFloat("-70")`
      // returned -70 (truthy), passing the `!w` guard and producing nonsense BMI.
      if (!Number.isFinite(w) || !Number.isFinite(hCm) || w <= 0 || hCm <= 0) return;
      const h = hCm / 100;
      bmi = w / (h * h);
    } else {
      const w = parseFloat(weight);
      const f = parseFloat(feet);
      const i = parseFloat(inches);
      if (!Number.isFinite(w) || !Number.isFinite(f) || w <= 0 || f < 0) return;
      // Inches can be 0 — only reject NaN. Negative inches make no sense.
      const inchesVal = Number.isFinite(i) && i >= 0 ? i : 0;
      const totalInches = f * 12 + inchesVal;
      if (totalInches <= 0) return;
      bmi = (w * 703) / (totalInches * totalInches);
    }

    bmi = Math.round(bmi * 10) / 10;

    let category = "";
    let color = "";
    let advice = "";
    if (bmi < 16) { category = "Severely Underweight"; color = "bg-blue-100 text-blue-800 border-blue-200"; advice = "You are significantly underweight. Please consult a healthcare professional for a proper nutrition plan."; }
    else if (bmi < 18.5) { category = "Underweight"; color = "bg-cyan-100 text-cyan-800 border-cyan-200"; advice = "You are slightly underweight. Consider adding nutrient-dense foods to your diet."; }
    else if (bmi < 25) { category = "Normal Weight"; color = "bg-green-100 text-green-800 border-green-200"; advice = "Great! You are within a healthy weight range. Maintain your current lifestyle."; }
    else if (bmi < 30) { category = "Overweight"; color = "bg-yellow-100 text-yellow-800 border-yellow-200"; advice = "You are slightly overweight. Regular exercise and a balanced diet can help."; }
    else if (bmi < 35) { category = "Obese (Class I)"; color = "bg-orange-100 text-orange-800 border-orange-200"; advice = "Consider consulting a healthcare provider about a weight management plan."; }
    else if (bmi < 40) { category = "Obese (Class II)"; color = "bg-red-100 text-red-800 border-red-200"; advice = "This level of obesity increases health risks. Please seek medical guidance."; }
    else { category = "Obese (Class III)"; color = "bg-red-200 text-red-900 border-red-300"; advice = "This is classified as severe obesity. Medical supervision is strongly recommended."; }

    setResult({ bmi, category, color, advice });
  };

  const reset = () => {
    setWeight(""); setHeight(""); setFeet(""); setInches(""); setResult(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enter Your Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Unit System</Label>
            <Select value={unit} onValueChange={(v) => { setUnit(v as "metric" | "imperial"); reset(); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                <SelectItem value="imperial">Imperial (lbs, ft/in)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Weight ({unit === "metric" ? "kg" : "lbs"})</Label>
            <Input type="number" placeholder={unit === "metric" ? "e.g. 70" : "e.g. 154"} value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>

          {unit === "metric" ? (
            <div className="space-y-2">
              <Label>Height (cm)</Label>
              <Input type="number" placeholder="e.g. 175" value={height} onChange={(e) => setHeight(e.target.value)} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Feet</Label>
                <Input type="number" placeholder="e.g. 5" value={feet} onChange={(e) => setFeet(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Inches</Label>
                <Input type="number" placeholder="e.g. 9" value={inches} onChange={(e) => setInches(e.target.value)} />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={calculate} className="flex-1">Calculate BMI</Button>
            <Button onClick={reset} variant="outline">Reset</Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-2">
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Your BMI</p>
              <p className="text-5xl font-bold">{result.bmi}</p>
              <Badge className={`${result.color} text-sm px-4 py-1`}>{result.category}</Badge>
            </div>

            {/* BMI Scale */}
            <div className="mt-6">
              <div className="relative h-4 rounded-full overflow-hidden flex">
                <div className="flex-1 bg-blue-400" />
                <div className="flex-1 bg-cyan-400" />
                <div className="flex-[2] bg-green-400" />
                <div className="flex-1 bg-yellow-400" />
                <div className="flex-1 bg-orange-400" />
                <div className="flex-1 bg-red-400" />
              </div>
              <div className="relative mt-1">
                <div
                  className="absolute w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-foreground -translate-x-1/2"
                  style={{ left: `${Math.min(100, Math.max(0, (result.bmi / 45) * 100))}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-4">
                <span>Underweight<br />{"< "}18.5</span>
                <span>Normal<br />18.5-24.9</span>
                <span>Overweight<br />25-29.9</span>
                <span>Obese<br />&gt; 30</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center mt-4">{result.advice}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Understanding BMI</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Body Mass Index (BMI) is a numerical value calculated from your weight and height. It provides a simple screening measure to categorize individuals as underweight, normal weight, overweight, or obese. While BMI does not directly measure body fat, it is a useful indicator of potential health risks associated with weight. Keep in mind that BMI does not account for muscle mass, bone density, or overall body composition.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}