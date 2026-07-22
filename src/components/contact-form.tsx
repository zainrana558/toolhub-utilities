"use client";

import { useState } from "react";
import { Mail, Github, Bug, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const subjectOptions = [
  "Bug Report",
  "Feature Request",
  "General Question",
  "Partnership",
];

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  // Honeypot: real users never fill this in
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, company }),
      });

      if (res.ok) {
        setStatus("success");
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
        setCompany("");
        return;
      }

      let msg = "Something went wrong. Please try again.";
      if (res.status === 429) {
        msg = "Too many submissions. Please wait a few minutes and try again.";
      } else {
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {
          /* keep default */
        }
      }
      setErrorMsg(msg);
      setStatus("error");
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  return (
    <>
      {/* Contact Methods */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <Card className="gap-0 py-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-5 w-5 text-primary" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href="mailto:hello@toolverse.com"
                className="text-sm text-primary hover:underline break-all"
              >
                hello@toolverse.com
              </a>
            </CardContent>
          </Card>

          <Card className="gap-0 py-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Github className="h-5 w-5 text-primary" />
                GitHub
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href="https://github.com/zainrana558/toolhub-utilities"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline break-all"
              >
                github.com/zainrana558/toolhub-utilities
              </a>
            </CardContent>
          </Card>

          <Card className="gap-0 py-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bug className="h-5 w-5 text-primary" />
                Bug Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href="https://github.com/zainrana558/toolhub-utilities/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Report an issue on GitHub
              </a>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Form */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Send Us a Message</h2>
        <Card className="gap-0 py-0">
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Name</Label>
                  <Input
                    id="contact-name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={status === "submitting"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={status === "submitting"}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-subject">Subject</Label>
                <Select
                  value={subject}
                  onValueChange={setSubject}
                  required
                  disabled={status === "submitting"}
                >
                  <SelectTrigger className="w-full" id="contact-subject">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
                  placeholder="Tell us what's on your mind..."
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  maxLength={5000}
                  disabled={status === "submitting"}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {message.length}/5000
                </p>
              </div>

              {/* Honeypot — visually hidden, ignored by real users, filled by bots */}
              <div aria-hidden="true" className="hidden">
                <Label htmlFor="contact-company">Company (leave empty)</Label>
                <Input
                  id="contact-company"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              {status === "success" && (
                <div className="flex items-start gap-2 rounded-lg border border-green-500/40 bg-green-500/5 p-3 text-sm text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Thank you! Your message has been sent. We&apos;ll get back to you within 24-48 hours.</span>
                </div>
              )}

              {status === "error" && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground">
                We typically respond within 24-48 hours.
              </p>
            </CardContent>
          </form>
        </Card>
      </section>
    </>
  );
}
