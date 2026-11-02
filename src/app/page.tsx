import { getPortfolioData } from "@/lib/portfolio";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ShowreelSection from "@/components/ShowreelSection";
import BeforeAfterSection from "@/components/BeforeAfterSection";
import ProjectsSection from "@/components/ProjectsSection";
import ServicesSection from "@/components/ServicesSection";
import SkillsSection from "@/components/SkillsSection";
import AboutSection from "@/components/AboutSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getPortfolioData();

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 selection:bg-amber-200 selection:text-amber-950 font-sans antialiased">
      {/* Public Navbar: Has NO Admin Link */}
      <Navbar name={data.profile.name} />

      <main>
        {/* Editorial Light Hero with Real Photo & Stats */}
        <HeroSection profile={data.profile} />

        {/* 2026 Showreel Cinema Showcase */}
        <ShowreelSection
          featuredVideo={data.profile.featuredVideo}
          name={data.profile.name}
        />

        {/* Interactive Before & After Color Grading & AI Slider */}
        <BeforeAfterSection />

        {/* Curated Works with Video Player & Photo Lightbox */}
        <ProjectsSection projects={data.projects || []} />

        {/* Creative Services & Deliverables */}
        <ServicesSection services={data.services || []} />

        {/* Creative Software & AI Toolstack */}
        <SkillsSection skills={data.skills || []} />

        {/* About Md Rajob Ali */}
        <AboutSection profile={data.profile} />

        {/* Client Endorsements & Reviews */}
        <TestimonialsSection testimonials={data.testimonials || []} />

        {/* Contact & Direct WhatsApp Chat */}
        <ContactSection profile={data.profile} />
      </main>

      {/* Footer with Discreet Hidden Admin Door */}
      <Footer name={data.profile.name} />
    </div>
  );
}
