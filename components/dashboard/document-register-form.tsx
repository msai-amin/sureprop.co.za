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

const DOC_TYPES = [
  { value: "ID", label: "Identity document" },
  { value: "BANK_STATEMENT", label: "Bank statement" },
  { value: "OFFER_TO_PURCHASE", label: "Offer to purchase" },
] as const;

export function DocumentRegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const type = String(fd.get("type") ?? "");
    const fileName = String(fd.get("fileName") ?? "").trim();

    if (!DOC_TYPES.some((t) => t.value === type) || !fileName) {
      setError("Choose a document type and file name.");
      setPending(false);
      return;
    }

    const res = await fetch("/api/v1/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, fileName }),
    });

    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { message?: string };
      setError(j.message ?? "Failed to register document.");
      setPending(false);
      return;
    }

    const data = (await res.json()) as {
      data?: { storageUrl?: string };
      uploadUrl?: { url?: string };
    };
    e.currentTarget.reset();
    setInfo(
      data.uploadUrl?.url
        ? "Metadata saved. Signed upload URL generated."
        : "Document metadata recorded.",
    );
    router.refresh();
    setPending(false);
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Register document</CardTitle>
        <CardDescription>
          Creates encrypted vault metadata and returns a signed upload URL.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="text-sm text-muted-foreground" role="status">
              {info}
            </p>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="doc-type">Type</Label>
            <select
              id="doc-type"
              name="type"
              required
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Select type
              </option>
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="doc-file">File name</Label>
            <Input
              id="doc-file"
              name="fileName"
              required
              placeholder="e.g. otp-final.pdf"
              autoComplete="off"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Register metadata"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
