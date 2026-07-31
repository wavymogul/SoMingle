import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ForYouFeed } from "@/components/foryou/ForYouFeed";
import { HomeEvents } from "@/components/HomeEvents";
import { ProblemSection } from "@/components/ProblemSection";
import { VisionSection } from "@/components/VisionSection";
import { MissionSection } from "@/components/MissionSection";
import { SurveyCTA } from "@/components/SurveyCTA";
import { Testimonials } from "@/components/Testimonials";
import { WaitlistSection } from "@/components/WaitlistSection";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Mobile gets the app-style For You feed; desktop keeps the hero. */}
        <ForYouFeed />
        <div className="hidden lg:block">
          <Hero />
          <HomeEvents />
        </div>
        <ProblemSection />
        <VisionSection />
        <MissionSection />
        <SurveyCTA />
        <Testimonials />
        <WaitlistSection />
      </main>
      <Footer />
    </>
  );
}
