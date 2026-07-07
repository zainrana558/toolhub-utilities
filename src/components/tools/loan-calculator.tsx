"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function LoanCalculator() {
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [years, setYears] = useState("");
  const [result, setResult] = useState<{
    monthly: number; totalPayment: number; totalInterest: number;
    schedule: { month: number; payment: number; principal: number; interest: number; balance: number }[];
  } | null>(null);

  const calculate = () => {
    const P = parseFloat(principal);
    const annualRate = parseFloat(rate) / 100;
    const n = parseFloat(years) * 12;
    if (!P || !annualRate || !n || P <= 0 || annualRate <= 0 || n <= 0) return;

    const r = annualRate / 12;
    const monthly = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = monthly * n;
    const totalInterest = totalPayment - P;

    const schedule: { month: number; payment: number; principal: number; interest: number; balance: number }[] = [];
    let balance = P;
    for (let i = 1; i <= n; i++) {
      const interest = balance * r;
      const principalPart = monthly - interest;
      balance -= principalPart;
      schedule.push({
        month: i,
        payment: monthly,
        principal: principalPart,
        interest,
        balance: Math.max(0, balance),
      });
    }

    setResult({ monthly, totalPayment, totalInterest, schedule });
  };

  const reset = () => {
    setPrincipal(""); setRate(""); setYears(""); setResult(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Loan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Loan Amount ($)</Label>
              <Input type="number" placeholder="e.g. 250000" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Annual Interest Rate (%)</Label>
              <Input type="number" step="0.01" placeholder="e.g. 6.5" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Loan Term (Years)</Label>
              <Input type="number" placeholder="e.g. 30" value={years} onChange={(e) => setYears(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={calculate} className="flex-1">Calculate Payment</Button>
            <Button onClick={reset} variant="outline">Reset</Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">Monthly Payment</p>
                <p className="text-3xl font-bold text-primary mt-1">${result.monthly.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">Total Payment</p>
                <p className="text-3xl font-bold mt-1">${result.totalPayment.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">Total Interest</p>
                <p className="text-3xl font-bold text-destructive mt-1">${result.totalInterest.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Pie chart-like visual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative w-32 h-32 rounded-full" style={{ background: `conic-gradient(hsl(var(--primary)) 0% ${((result.principal || parseFloat(principal)) / result.totalPayment * 100).toFixed(1)}%, hsl(var(--destructive)) ${((result.principal || parseFloat(principal)) / result.totalPayment * 100).toFixed(1)}% 100%)` }}>
                  <div className="absolute inset-4 bg-card rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium">{((result.totalInterest / result.totalPayment) * 100).toFixed(1)}% interest</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-sm">Principal: ${parseFloat(principal).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                    <span className="text-sm">Interest: ${result.totalInterest.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Amortization Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4">Year</th>
                      <th className="pb-2 pr-4">Principal</th>
                      <th className="pb-2 pr-4">Interest</th>
                      <th className="pb-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.ceil(result.schedule.length / 12) }, (_, i) => {
                      const yearPayments = result.schedule.slice(i * 12, (i + 1) * 12);
                      const yearPrincipal = yearPayments.reduce((s, p) => s + p.principal, 0);
                      const yearInterest = yearPayments.reduce((s, p) => s + p.interest, 0);
                      const endBalance = yearPayments[yearPayments.length - 1].balance;
                      return (
                        <tr key={i} className="border-b border-muted/50">
                          <td className="py-2 pr-4">{i + 1}</td>
                          <td className="py-2 pr-4">${yearPrincipal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</td>
                          <td className="py-2 pr-4">${yearInterest.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</td>
                          <td className="py-2">${endBalance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}