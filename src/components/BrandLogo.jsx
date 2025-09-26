// src/components/BrandLogo.jsx
export default function BrandLogo({ className = "h-8 w-auto", alt = "DahTruth" }) {
  return <img src="/DahTruthLogo.png" alt={alt} className={className} draggable={false} />;
}
