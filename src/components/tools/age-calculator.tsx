"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AgeCalculator() {
  const [birthDate, setBirthDate] = useState("");
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split("T")[0]);
  const [result, setResult] = useState<{
    years: number; months: number; days: number;
    totalDays: number; totalWeeks: number; totalMonths: number; totalHours: number; totalMinutes: number;
    nextBirthday: number; nextBirthdayDate: string;
    dayOfWeek: string;
    zodiac: string;
  } | null>(null);

  const calculate = () => {
    const birth = new Date(birthDate);
    const target = new Date(targetDate);
    if (isNaN(birth.getTime()) || isNaN(target.getTime())) return;
    if (birth > target) return;

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const zodiacSigns = [
      { sign: "Capricorn", start: [1, 1], end: [1, 19] },
      { sign: "Aquarius", start: [1, 20], end: [2, 18] },
      { sign: "Pisces", start: [2, 19], end: [3, 20] },
      { sign: "Aries", start: [3, 21], end: [4, 19] },
      { sign: "Taurus", start: [4, 20], end: [5, 20] },
      { sign: "Gemini", start: [5, 21], end: [6, 20] },
      { sign: "Cancer", start: [6, 21], end: [7, 22] },
      { sign: "Leo", start: [7, 23], end: [8, 22] },
      { sign: "Virgo", start: [8, 23], end: [9, 22] },
      { sign: "Libra", start: [9, 23], end: [10, 22] },
      { sign: "Scorpio", start: [10, 23], end: [11, 21] },
      { sign: "Sagittarius", start: [11, 22], end: [12, 21] },
      { sign: "Capricorn", start: [12, 22], end: [12, 31] },
    ];

    const birthMonth = birth.getMonth() + 1;
    const birthDay = birth.getDate();
    const zodiac = zodiacSigns.find((z) => {
      return (birthMonth === z.start[0] && birthDay >= z.start[1]) || (birthMonth === z.end[0] && birthDay <= z.end[1]);
    })?.sign || "Unknown";

    let years = target.getFullYear() - birth.getFullYear();
    let months = target.getMonth() - birth.getMonth();
    let days = target.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const diffMs = target.getTime() - birth.getTime();
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = years * 12 + months;
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const totalMinutes = Math.floor(diffMs / (1000 * 60));

    const nextBirth = new Date(target.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextBirth <= target) {
      nextBirth.setFullYear(nextBirth.getFullYear() + 1);
    }
    const daysUntilBirthday = Math.ceil((nextBirth.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
    const nextBirthdayDate = nextBirth.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    setResult({
      years, months, days,
      totalDays, totalWeeks, totalMonths, totalHours, totalMinutes,
      nextBirthday: daysUntilBirthday,
      nextBirthdayDate,
      dayOfWeek: daysOfWeek[birth.getDay()],
      zodiac,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enter Your Date of Birth</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-2">
              <Label>Age at Date</Label>
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
          </div>
          <Button onClick={calculate} className="w-full" disabled={!birthDate}>Calculate Age</Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="text-center space-y-2 mb-6">
                <p className="text-sm text-muted-foreground">Your Age</p>
                <p className="text-4xl md:text-5xl font-bold">
                  {result.years} <span className="text-lg font-normal text-muted-foreground">years</span>{" "}
                  {result.months} <span className="text-lg font-normal text-muted-foreground">months</span>{" "}
                  {result.days} <span className="text-lg font-normal text-muted-foreground">days</span>
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <AgeStat label="Total Months" value={result.totalMonths.toLocaleString()} />
                <AgeStat label="Total Weeks" value={result.totalWeeks.toLocaleString()} />
                <AgeStat label="Total Days" value={result.totalDays.toLocaleString()} />
                <AgeStat label="Total Hours" value={result.totalHours.toLocaleString()} />
                <AgeStat label="Born On" value={result.dayOfWeek} />
                <AgeStat label="Zodiac Sign" value={result.zodiac} />
                <AgeStat label="Next Birthday" value={`${result.nextBirthday} days`} />
                <AgeStat label="Birthday Date" value={result.nextBirthdayDate} />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function AgeStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-muted/50 rounded-lg text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-bold text-sm">{value}</p>
    </div>
  );
}