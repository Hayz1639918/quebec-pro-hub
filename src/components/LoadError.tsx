import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface LoadErrorProps {
  message: string;
  onRetry: () => Promise<unknown>;
}

/** Keep unavailable data distinct from a successfully loaded empty result. */
export default function LoadError({ message, onRetry }: LoadErrorProps) {
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <p>{message}</p>
        <Button variant="outline" className="mt-3" disabled={retrying} onClick={() => void retry()}>
          {retrying ? "Chargement…" : "Réessayer"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
