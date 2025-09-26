// src/components/BrandLogo.jsx
import logo from "../assets/brand/logo-light.svg"; // update the filename if yours differs

export default function BrandLogo({ className = "h-8 w-auto", alt = "DahTruth" }) {
  return <img src={logo} alt={alt} className={className} draggable={false} />;
}
