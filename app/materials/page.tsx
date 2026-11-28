import type { Metadata } from "next";
import Image from "next/image";
import { headers } from "next/headers";
import MaterialsList from "../MaterialsList";

export const metadata: Metadata = {
  title: "What You Need - Mandala Masterclass",
  description: "Everything you need for the Mandala Masterclass, under $30, with Amazon links.",
};

// Linked from the receipt and gift emails: emails can't carry Amazon affiliate links, this page can.
export default async function MaterialsPage() {
  const country = (await headers()).get("x-vercel-ip-country");
  return (
    <main style={{ minHeight: "100vh", background: "#f8f6f3", padding: "56px 20px 72px", fontFamily: "'Lora', Georgia, serif" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 13, letterSpacing: 3, fontWeight: 700, color: "#b47b45", margin: "0 0 10px" }}>MANDALA MASTERCLASS</p>
        <h1 style={{ fontSize: "clamp(1.9rem, 5vw, 2.4rem)", color: "#1a1f3d", fontWeight: 500, margin: "0 0 12px" }}>What you&apos;ll need</h1>
        <p style={{ fontSize: 18, color: "#6b7089", lineHeight: 1.6, margin: "0 0 26px" }}>
          A few simple things, all together under $30. Good news: we provide Amazon links for all of them.
        </p>
        <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", maxWidth: 420, margin: "0 auto 28px", borderRadius: 16, overflow: "hidden", boxShadow: "0 12px 40px rgba(26,45,107,0.18)" }}>
          <Image src="/materials.webp" alt="Fineliner pens, a compass, a drawing pad, a pencil and a ruler on a wooden table" fill style={{ objectFit: "cover" }} priority />
        </div>
        <MaterialsList country={country} />
      </div>
    </main>
  );
}
