"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

interface UnitDef {
  name: string;
  factor: number;
}

const categories: Record<string, { name: string; units: Record<string, UnitDef>; baseUnit: string }> = {
  length: {
    name: "Length",
    baseUnit: "meter",
    units: {
      meter: { name: "Meter (m)", factor: 1 },
      kilometer: { name: "Kilometer (km)", factor: 1000 },
      centimeter: { name: "Centimeter (cm)", factor: 0.01 },
      millimeter: { name: "Millimeter (mm)", factor: 0.001 },
      mile: { name: "Mile (mi)", factor: 1609.344 },
      yard: { name: "Yard (yd)", factor: 0.9144 },
      foot: { name: "Foot (ft)", factor: 0.3048 },
      inch: { name: "Inch (in)", factor: 0.0254 },
    },
  },
  weight: {
    name: "Weight",
    baseUnit: "kilogram",
    units: {
      kilogram: { name: "Kilogram (kg)", factor: 1 },
      gram: { name: "Gram (g)", factor: 0.001 },
      milligram: { name: "Milligram (mg)", factor: 0.000001 },
      pound: { name: "Pound (lb)", factor: 0.453592 },
      ounce: { name: "Ounce (oz)", factor: 0.0283495 },
      ton: { name: "Metric Ton (t)", factor: 1000 },
    },
  },
  temperature: {
    name: "Temperature",
    baseUnit: "celsius",
    units: {
      celsius: { name: "Celsius (C)", factor: 1 },
      fahrenheit: { name: "Fahrenheit (F)", factor: 1 },
      kelvin: { name: "Kelvin (K)", factor: 1 },
    },
  },
  volume: {
    name: "Volume",
    baseUnit: "liter",
    units: {
      liter: { name: "Liter (L)", factor: 1 },
      milliliter: { name: "Milliliter (mL)", factor: 0.001 },
      gallon: { name: "US Gallon (gal)", factor: 3.78541 },
      quart: { name: "US Quart (qt)", factor: 0.946353 },
      pint: { name: "US Pint (pt)", factor: 0.473176 },
      cup: { name: "US Cup", factor: 0.236588 },
      tablespoon: { name: "Tablespoon", factor: 0.0147868 },
      teaspoon: { name: "Teaspoon", factor: 0.00492892 },
    },
  },
  area: {
    name: "Area",
    baseUnit: "sqmeter",
    units: {
      sqmeter: { name: "Square Meter (m2)", factor: 1 },
      sqkilometer: { name: "Square Kilometer (km2)", factor: 1000000 },
      sqmile: { name: "Square Mile (mi2)", factor: 2589988.11 },
      sqyard: { name: "Square Yard (yd2)", factor: 0.836127 },
      sqfoot: { name: "Square Foot (ft2)", factor: 0.092903 },
      acre: { name: "Acre", factor: 4046.86 },
      hectare: { name: "Hectare (ha)", factor: 10000 },
    },
  },
  speed: {
    name: "Speed",
    baseUnit: "mps",
    units: {
      mps: { name: "Meters/sec (m/s)", factor: 1 },
      kph: { name: "Kilometers/hr (km/h)", factor: 0.277778 },
      mph: { name: "Miles/hr (mph)", factor: 0.44704 },
      knot: { name: "Knot (kn)", factor: 0.514444 },
      fps: { name: "Feet/sec (ft/s)", factor: 0.3048 },
    },
  },
  data: {
    name: "Data",
    baseUnit: "byte",
    units: {
      byte: { name: "Byte (B)", factor: 1 },
      kilobyte: { name: "Kilobyte (KB)", factor: 1024 },
      megabyte: { name: "Megabyte (MB)", factor: 1048576 },
      gigabyte: { name: "Gigabyte (GB)", factor: 1073741824 },
      terabyte: { name: "Terabyte (TB)", factor: 1099511627776 },
    },
  },
};

function convert(value: number, from: string, to: string, categoryId: string): number | null {
  if (categoryId === "temperature") {
    let celsius: number;
    if (from === "celsius") celsius = value;
    else if (from === "fahrenheit") celsius = (value - 32) * (5 / 9);
    else celsius = value - 273.15;

    if (to === "celsius") return celsius;
    if (to === "fahrenheit") return celsius * (9 / 5) + 32;
    return celsius + 273.15;
  }

  const cat = categories[categoryId];
  const fromFactor = cat.units[from].factor;
  const toFactor = cat.units[to].factor;
  return (value * fromFactor) / toFactor;
}

export function UnitConverter() {
  const [category, setCategory] = useState("length");
  const [fromUnit, setFromUnit] = useState("meter");
  const [toUnit, setToUnit] = useState("foot");
  const [fromValue, setFromValue] = useState("1");
  const [toValue, setToValue] = useState("");

  const currentCat = categories[category];
  const unitKeys = Object.keys(currentCat.units);

  const handleFromChange = (val: string) => {
    setFromValue(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      const result = convert(num, fromUnit, toUnit, category);
      setToValue(result !== null ? parseFloat(result.toPrecision(10)).toString() : "");
    } else {
      setToValue("");
    }
  };

  const handleToChange = (val: string) => {
    setToValue(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      const result = convert(num, toUnit, fromUnit, category);
      setFromValue(result !== null ? parseFloat(result.toPrecision(10)).toString() : "");
    } else {
      setFromValue("");
    }
  };

  const swap = () => {
    const newFrom = toUnit;
    const newTo = fromUnit;
    setFromUnit(newFrom);
    setToUnit(newTo);
    const num = parseFloat(fromValue);
    if (!isNaN(num)) {
      const result = convert(num, newFrom, newTo, category);
      setToValue(result !== null ? parseFloat(result.toPrecision(10)).toString() : "");
    }
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    const keys = Object.keys(categories[cat].units);
    setFromUnit(keys[0]);
    setToUnit(keys[1]);
    setFromValue("1");
    const result = convert(1, keys[0], keys[1], cat);
    setToValue(result !== null ? parseFloat(result.toPrecision(10)).toString() : "");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(categories).map(([key, cat]) => (
              <Button
                key={key}
                variant={category === key ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(key)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Convert {currentCat.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
            <div className="space-y-2">
              <Label>From</Label>
              <Select value={fromUnit} onValueChange={setFromUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {unitKeys.map((key) => (
                    <SelectItem key={key} value={key}>{currentCat.units[key].name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={fromValue}
                onChange={(e) => handleFromChange(e.target.value)}
                className="text-lg"
              />
            </div>

            <Button variant="ghost" size="icon" onClick={swap} className="mb-2">
              <ArrowUpDown className="h-4 w-4" />
            </Button>

            <div className="space-y-2">
              <Label>To</Label>
              <Select value={toUnit} onValueChange={setToUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {unitKeys.map((key) => (
                    <SelectItem key={key} value={key}>{currentCat.units[key].name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={toValue}
                onChange={(e) => handleToChange(e.target.value)}
                className="text-lg"
              />
            </div>
          </div>

          {fromValue && toValue && (
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-lg font-medium">
                {fromValue} {currentCat.units[fromUnit].name.split("(")[0].trim()} ={" "}
                <span className="font-bold text-primary">{toValue}</span> {currentCat.units[toUnit].name.split("(")[0].trim()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick reference table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {unitKeys.slice(0, 6).map((key) => {
              const val = convert(1, fromUnit, key, category);
              if (val === null) return null;
              return (
                <div key={key} className="flex justify-between p-2 bg-muted/50 rounded text-sm">
                  <span className="text-muted-foreground">1 {currentCat.units[fromUnit].name.split("(")[0].trim()}</span>
                  <span className="font-medium">{parseFloat(val.toPrecision(10))} {currentCat.units[key].name.split("(")[0].trim()}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}