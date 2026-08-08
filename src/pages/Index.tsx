import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import TrustBand from "@/components/TrustBand";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import "@/styles/home-reference.css";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation homeStyle />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <TrustBand />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
