"use client";

import { PublicNavbar } from "@/components/layout/public-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useState } from "react";

export function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <main className="min-h-screen bg-slate-50">
      <PublicNavbar />
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-slate-950">Contact Us</h1>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent>
              <h2 className="text-xl font-semibold text-slate-950">
                Get in touch
              </h2>
              <div className="mt-6 space-y-5 text-slate-600">
                <p>
                  <strong className="text-slate-900">Email:</strong>{" "}
                  support@apifyn.com
                </p>
                <p>
                  <strong className="text-slate-900">Support:</strong> Business
                  hours for standard support, 24/7 for enterprise customers.
                </p>
                <p>
                  <strong className="text-slate-900">Docs:</strong> Workflow and
                  webhook documentation is being moved into the monorepo docs
                  folder.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  setSent(true);
                }}
              >
                <Input required name="name" placeholder="Full name" />
                <Input
                  required
                  name="email"
                  type="email"
                  placeholder="Email address"
                />
                <Input required name="subject" placeholder="Subject" />
                <Textarea
                  required
                  name="message"
                  rows={5}
                  placeholder="How can we help?"
                />
                <Button className="w-full" type="submit">
                  <Send className="h-4 w-4" />
                  {sent ? "Message queued" : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
