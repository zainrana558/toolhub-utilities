"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Upload } from "lucide-react";

export function JSONFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState("formatted");

  const formatJSON = () => {
    setError("");
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setTab("formatted");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const minifyJSON = () => {
    setError("");
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setTab("formatted");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const validateJSON = () => {
    setError("");
    try {
      const parsed = JSON.parse(input);
      const keys = Object.keys(parsed);
      let info = "Valid JSON!";
      if (Array.isArray(parsed)) info += `\nType: Array with ${parsed.length} items`;
      else if (typeof parsed === "object" && parsed !== null) info += `\nType: Object with ${keys.length} keys`;
      else info += `\nType: ${typeof parsed}`;
      setOutput(info);
      setTab("formatted");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setInput(ev.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const copyOutput = async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePastedSample = () => {
    const sample = {
      name: "John Doe",
      age: 30,
      email: "john@example.com",
      address: { city: "New York", zip: "10001" },
      hobbies: ["reading", "coding", "gaming"],
      active: true,
    };
    setInput(JSON.stringify(sample));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Input JSON</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePastedSample}>
              <Upload className="h-3 w-3 mr-1" /> Sample
            </Button>
            <label htmlFor="json-file" className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span><Upload className="h-3 w-3 mr-1" /> Upload .json</span>
              </Button>
            </label>
            <input id="json-file" type="file" accept=".json,.txt" className="hidden" onChange={handleFileUpload} />
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Paste your JSON here, e.g. {"name": "John", "age": 30}'
            className="min-h-[200px] font-mono text-sm resize-y"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            <Button onClick={formatJSON} disabled={!input}>Format / Beautify</Button>
            <Button onClick={minifyJSON} variant="outline" disabled={!input}>Minify</Button>
            <Button onClick={validateJSON} variant="outline" disabled={!input}>Validate</Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-destructive">JSON Error:</p>
            <p className="text-sm text-destructive/80 mt-1 font-mono">{error}</p>
          </CardContent>
        </Card>
      )}

      {output && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Result</CardTitle>
            <Button variant="ghost" size="sm" onClick={copyOutput}>
              {copied ? <Check className="h-4 w-4 mr-1 text-green-500" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="mb-3">
                <TabsTrigger value="formatted">Formatted</TabsTrigger>
                <TabsTrigger value="tree">Tree View</TabsTrigger>
              </TabsList>
              <TabsContent value="formatted">
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
                  {output}
                </pre>
              </TabsContent>
              <TabsContent value="tree">
                <JSONTree data={(() => { try { return JSON.parse(input); } catch { return null; } })()} depth={0} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">JSON Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {input ? (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{input.length} chars</Badge>
              <Badge variant="secondary">{input.split("\n").length} lines</Badge>
              <Badge variant="secondary">{(input.length / 1024).toFixed(1)} KB</Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Paste JSON above to see statistics.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function JSONTree({ data, depth }: { data: unknown; depth: number }) {
  if (data === null) return <span className="text-muted-foreground">null</span>;
  if (typeof data === "boolean") return <span className="text-amber-600 dark:text-amber-400">{data.toString()}</span>;
  if (typeof data === "number") return <span className="text-sky-600 dark:text-sky-400">{data}</span>;
  if (typeof data === "string") return <span className="text-emerald-600 dark:text-emerald-400">&quot;{data}&quot;</span>;

  if (Array.isArray(data)) {
    return (
      <div className="pl-4 border-l border-border/30">
        <span className="text-muted-foreground text-xs">Array [{data.length}]</span>
        {data.map((item, i) => (
          <div key={i} className="flex gap-1 py-0.5">
            <span className="text-muted-foreground text-xs w-6 shrink-0">{i}:</span>
            <JSONTree data={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof data === "object") {
    return (
      <div className="pl-4 border-l border-border/30">
        <span className="text-muted-foreground text-xs">Object {"{"}{Object.keys(data as Record<string, unknown>).length}{"}"}</span>
        {Object.entries(data as Record<string, unknown>).map(([key, value]) => (
          <div key={key} className="flex gap-1 py-0.5 flex-wrap">
            <span className="text-purple-600 dark:text-purple-400 text-xs">{key}:</span>
            <JSONTree data={value} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  return <span>{String(data)}</span>;
}