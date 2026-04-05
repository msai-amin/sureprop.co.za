"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

const freeFeatures = [
  "Public profile & basic listing presence",
  "Lead notifications (limited volume)",
  "Document vault entry (tiered storage limits apply)",
];

const proFeatures = [
  "Premium placement & expanded listings",
  "Full lead CRM pipeline",
  "Priority integrations (Paystack, verification partners)",
  "Enhanced audit and support SLAs",
];

const faqItems = [
  {
    q: "Who is the free tier for?",
    a: "Professionals onboarding the network—agents, attorneys, and bond teams can start free while you validate workflows. Upgrade when volume or compliance needs grow.",
  },
  {
    q: "How does billing work?",
    a: "Subscriptions will be managed via Paystack (recurring). Exact ZAR pricing is finalized with your go-to-market plan—this page shows the product structure.",
  },
  {
    q: "Is buyer access charged?",
    a: "Buyer-facing discovery can remain free; monetisation focuses on professional seats and premium tooling.",
  },
  {
    q: "POPIA and document storage?",
    a: "Documents are stored privately with encryption and strict access paths. Your privacy policy and operator agreements still apply—SureProp supplies the technical controls.",
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="secondary" className="mb-4">
          Freemium for professionals
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Simple plans for serious property work
        </h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Start free, scale when your firm needs CRM depth, vault capacity, and
          integrations. Toggle shows how annual billing will discount once
          prices are live.
        </p>

        <div
          className="mt-8 inline-flex rounded-lg border border-border bg-muted/40 p-1"
          role="group"
          aria-label="Billing period"
        >
          <Button
            type="button"
            variant={!annual ? "default" : "ghost"}
            size="sm"
            className="rounded-md"
            onClick={() => setAnnual(false)}
            aria-pressed={!annual}
          >
            Monthly
          </Button>
          <Button
            type="button"
            variant={annual ? "default" : "ghost"}
            size="sm"
            className="rounded-md gap-1.5"
            onClick={() => setAnnual(true)}
            aria-pressed={annual}
          >
            Annual
            <Badge variant="secondary" className="text-[10px] px-1.5">
              Save
            </Badge>
          </Button>
        </div>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:gap-8">
        <Card className="border-border/80 flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl">Free</CardTitle>
            <CardDescription>
              For onboarding teams validating the marketplace.
            </CardDescription>
            <p className="pt-2 text-3xl font-semibold tracking-tight">
              R0
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / seat / month
              </span>
            </p>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3 text-sm">
              {freeFeatures.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  <span className="leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Link
              href="/signup"
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              Start free
            </Link>
          </CardFooter>
        </Card>

        <Card className="border-primary/30 bg-gradient-to-b from-primary/5 to-card shadow-md flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">Professional</CardTitle>
              <Badge>Popular</Badge>
            </div>
            <CardDescription>
              For high-volume agents, firms, and bond desks.
            </CardDescription>
            <p className="pt-2 text-3xl font-semibold tracking-tight">
              {annual ? "R—" : "R—"}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / seat / month
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Placeholder pricing—set when you launch billing.
            </p>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3 text-sm">
              {proFeatures.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  <span className="leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/signup" className={cn(buttonVariants(), "w-full")}>
              Talk to us
            </Link>
          </CardFooter>
        </Card>
      </div>

      <section className="mt-20" aria-labelledby="faq-heading">
        <h2
          id="faq-heading"
          className="text-2xl font-semibold tracking-tight text-center"
        >
          Frequently asked questions
        </h2>
        <Accordion multiple={false} className="mt-8 max-w-2xl mx-auto">
          {faqItems.map((item, i) => (
            <AccordionItem key={item.q} value={`faq-${i}`}>
              <AccordionTrigger className="text-left">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
