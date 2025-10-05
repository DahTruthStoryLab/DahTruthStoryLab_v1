import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function BillingSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get("session_id");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Optional: fetch your backend to confirm session & update UI
    setLoading(false);
  }, [sessionId]);

  return (
    <div className="min-h-[60vh] grid place-items-center">
      <div className="glass-panel p-8 text-center max-w-md">
        <CheckCircle size={36} className="mx-auto mb-3 text-[color:var(--color-ink)]/80" />
        <h1 className="heading-serif text-2xl font-bold mb-1">Payment Successful</h1>
        <p className="text-muted mb-5">
          {loading ? "Finalizing your subscription…" : "Your account is now active."}
        </p>
        <button onClick={() => navigate("/dashboard")} className="btn-primary">
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
