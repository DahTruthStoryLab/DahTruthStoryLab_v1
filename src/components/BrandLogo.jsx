// src/components/BrandLogo.jsx
import logo from "/src/assets/brand/logo-light.svg";

export default function BrandLogo({ className = "h-8 w-auto", alt = "DahTruth" }) {
  return <img src={logo} alt={alt} className={className} draggable={false} />;
}
