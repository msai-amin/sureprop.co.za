"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PropertyCreateForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const price = Number(fd.get("price"));
    const city = String(fd.get("city") ?? "").trim();
    const province = String(fd.get("province") ?? "").trim();

    if (!title || Number.isNaN(price) || price <= 0 || !city) {
      setError("Title, a valid price, and city are required.");
      setPending(false);
      return;
    }

    const res = await fetch("/api/v1/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        price,
        location: { city, province: province || undefined, country: "ZA" },
        features: {},
      }),
    });

    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { message?: string };
      setError(j.message ?? "Failed to create listing.");
      setPending(false);
      return;
    }

    e.currentTarget.reset();
    router.refresh();
    setPending(false);
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">New listing</CardTitle>
        <CardDescription>
          Creates an active property record. Buyers can submit leads while status
          is active.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="prop-title">Title</Label>
            <Input
              id="prop-title"
              name="title"
              required
              placeholder="e.g. 2-bed apartment, Sea Point"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="prop-price">Price (ZAR)</Label>
              <Input
                id="prop-price"
                name="price"
                type="number"
                min={1}
                step="0.01"
                required
                placeholder="2500000"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prop-city">City</Label>
              <Input
                id="prop-city"
                name="city"
                required
                placeholder="Cape Town"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="prop-province">Province (optional)</Label>
            <Input
              id="prop-province"
              name="province"
              placeholder="Western Cape"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Publish listing"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
