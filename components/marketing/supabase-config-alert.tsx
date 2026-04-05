import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

function EnvNames() {
  return (
    <>
      <code className="rounded bg-muted px-1 py-0.5 text-xs">
        NEXT_PUBLIC_SUPABASE_URL
      </code>{" "}
      and{" "}
      <code className="rounded bg-muted px-1 py-0.5 text-xs">
        NEXT_PUBLIC_SUPABASE_ANON_KEY
      </code>
    </>
  );
}

/**
 * Shown when Supabase publishable env is missing (middleware redirect or server check).
 */
export function SupabaseConfigAlert({ className }: { className?: string }) {
  const onVercel = process.env.VERCEL === "1";

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="size-4" aria-hidden />
      <AlertTitle>Supabase is not configured</AlertTitle>
      <AlertDescription className="space-y-2 text-left">
        {onVercel ? (
          <>
            <p>
              Add <EnvNames /> in the{" "}
              <strong className="font-medium text-foreground">
                Vercel project → Settings → Environment Variables
              </strong>{" "}
              for <strong className="font-medium text-foreground">Production</strong>{" "}
              (and <strong className="font-medium text-foreground">Preview</strong> if you
              use it). Use the same values as in{" "}
              <a
                href="https://supabase.com/dashboard/project/_/settings/api"
                className="font-medium text-primary underline underline-offset-2"
                target="_blank"
                rel="noreferrer"
              >
                Supabase → Project Settings → API
              </a>
              .
            </p>
            <p>
              <strong className="font-medium text-foreground">Redeploy</strong> after
              saving — <code className="rounded bg-muted px-1 text-xs">NEXT_PUBLIC_*</code>{" "}
              variables are embedded at <strong className="font-medium text-foreground">build</strong>{" "}
              time, so a new deployment is required for the app to see them.
            </p>
          </>
        ) : (
          <p>
            Add <EnvNames /> to{" "}
            <code className="rounded bg-muted px-1 text-xs">.env.local</code> at the app
            root (see <code className="rounded bg-muted px-1 text-xs">env.example</code>
            ), then restart <code className="rounded bg-muted px-1 text-xs">npm run dev</code>
            .
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
