"use client";

import { useState } from "react";
import { Mail, Github, Bug, Send } from "lucide-react";
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

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    alert("Thank you! We'll get back to you soon.");
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
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
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-subject">Subject</Label>
                <Select value={subject} onValueChange={setSubject} required>
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
                />
              </div>

              <Button type="submit" className="w-full sm:w-auto">
                <Send className="mr-2 h-4 w-4" />
                Send Message
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