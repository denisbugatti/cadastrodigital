/**
 * Google OAuth Callback Page
 * This page is opened in a popup window by the Google Sheets integration panel.
 * It receives the OAuth code from Google and passes it back to the parent window.
 */

import { useEffect, useState } from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function GoogleOAuthCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processando autorização...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error) {
      setStatus("error");
      setMessage(`Autorização negada: ${error}`);
      // Notify parent window of error
      if (window.opener) {
        window.opener.postMessage({ type: "GOOGLE_OAUTH_ERROR", error }, window.location.origin);
      }
      setTimeout(() => window.close(), 2000);
      return;
    }

    if (code) {
      setStatus("success");
      setMessage("Autorização concluída! Fechando...");
      // Send code back to parent window
      if (window.opener) {
        window.opener.postMessage({ type: "GOOGLE_OAUTH_CODE", code }, window.location.origin);
      }
      setTimeout(() => window.close(), 1500);
      return;
    }

    setStatus("error");
    setMessage("Código de autorização não encontrado.");
    setTimeout(() => window.close(), 2000);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
            <p className="text-sm text-green-700 font-medium">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="text-sm text-red-700">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
