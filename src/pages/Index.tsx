import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import FeaturedProjects from "@/components/home/FeaturedProjects";
import HowItWorks from "@/components/HowItWorks";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation variant="home" />
      <Hero />
      <FeaturedProjects />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;