// src/pages/Publishing.tsx
import { useMemo, useRef, useState } from "react";
import PageShell from "../components/layout/PageShell";
import AeroBanner from "../components/layout/AeroBanner";

type StepKey = "builder" | "review" | "publish";
const STEPS: { key: StepKey; label: string }[] = [
  { key: "builder", label: "Builder" },
  { key: "review",  label: "Review" },
  { key: "publish", label: "Publish" },
];

export default function Publishing(): JSX.Element {
  const [step, setStep] = useState<StepKey>("builder");
  const stepIndex = useMemo(() => STEPS.findIndex(s => s.key === step), [step]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const goNext = () =>
    setStep(STEPS[Math.min(stepIndex + 1, STEPS.length - 1)].key);
  const goBack = () =>
    setStep(STEPS[Math.max(stepIndex - 1, 0)].key);

  return (
    <PageShell>
      <AeroBanner
        role="region"
        aria-label="Page banner"
        style={{
          background: "linear-gradient(135deg, rgba(10,37,64,.95), rgba(31,58,95,.85))",
          color: "white",
          padding: 20,
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(10, 37, 64, .30)",
          marginBottom: 20,
        }}
      >
        <h1 style={{ margin: 0 }}>Publishing</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={goBack} disabled={stepIndex === 0}>Back</button>
          <span>{STEPS[stepIndex].label}</span>
          <button onClick={goNext} disabled={stepIndex === STEPS.length - 1}>Next</button>
        </div>
      </AeroBanner>

      <div ref={containerRef} style={{ padding: 16 }}>
        <p>Current step: <strong>{step}</strong></p>
      </div>
    </PageShell>
  );
}
