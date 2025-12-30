import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart, Target, Eye, Sparkles, Users, Building, 
  Calendar, MapPin, ArrowLeft, Mail, BookOpen, Briefcase
} from "lucide-react";

// Brand colors (matching your CSS variables)
const COLORS = {
  bg: "#F2F5F9",
  white: "#FFFFFF",
  text: "#0A2540",
  subtext: "#5B6B7C",
  border: "rgba(10,37,64,0.10)",
  borderStrong: "rgba(10,37,64,0.18)",
  primary: "#0A2540",
  accent: "#335D92",
  highlight: "#EAF2FB",
  gold: "#D4AF37",
};

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: COLORS.bg,
        color: COLORS.text,
      }}
    >
      <div className="max-w-4xl mx-auto px-6 py-14">
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-8 text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: COLORS.accent }}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <img
            src="/DahTruthLogo.png"
            alt="DahTruth StoryLab"
            className="mx-auto h-24 mb-6 rounded-full shadow-lg"
            style={{ border: `3px solid ${COLORS.gold}` }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ 
              fontFamily: "'EB Garamond', Georgia, serif",
              color: COLORS.text,
            }}
          >
            About DAHTRUTH, LLC
          </h1>
          <div 
            className="w-24 h-1 mx-auto rounded-full"
            style={{ backgroundColor: COLORS.gold }}
          />
        </div>

        {/* Company Info */}
        <div 
          className="rounded-2xl p-8 mb-10 shadow-lg"
          style={{ 
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.borderStrong}`,
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="w-12 h-12 rounded-xl grid place-items-center"
              style={{ backgroundColor: COLORS.highlight }}
            >
              <Building size={24} color={COLORS.accent} />
            </div>
            <h2 
              className="text-2xl font-bold"
              style={{ 
                fontFamily: "'EB Garamond', Georgia, serif",
                color: COLORS.text,
              }}
            >
              Our Company
            </h2>
          </div>

          <div className="space-y-4" style={{ color: COLORS.text, lineHeight: 1.8 }}>
            <p>
              <strong>DAHTRUTH, LLC</strong> was founded on <strong>August 22, 2025</strong>, by Jacqueline Session Ausby. 
              The company is registered as a Limited Liability Company (LLC) in the State of New Jersey and is taxed as an S-Corporation.
            </p>
            
            <p>
              Though privately held, DAHTRUTH identifies as a <strong>minority- and woman-owned enterprise</strong>, 
              founded and operated by two African American sisters with a shared vision: to democratize storytelling 
              through accessible technology and community engagement.
            </p>

            <p>
              DAHTRUTH is currently self-funded and in its early growth phase. The company plans to pursue small-business 
              grants and minority-enterprise certification through the <strong>New Jersey MBE program</strong>. Upon securing funding, 
              operations will expand to include paid instructors, technical support, marketing staff, and strategic 
              partnerships with schools and creative organizations.
            </p>
          </div>

          {/* Quick Facts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div 
              className="rounded-xl p-4 text-center"
              style={{ backgroundColor: COLORS.highlight }}
            >
              <Calendar size={20} color={COLORS.accent} className="mx-auto mb-2" />
              <p className="text-xs" style={{ color: COLORS.subtext }}>Founded</p>
              <p className="font-semibold" style={{ color: COLORS.text }}>August 22, 2025</p>
            </div>
            <div 
              className="rounded-xl p-4 text-center"
              style={{ backgroundColor: COLORS.highlight }}
            >
              <MapPin size={20} color={COLORS.accent} className="mx-auto mb-2" />
              <p className="text-xs" style={{ color: COLORS.subtext }}>Headquarters</p>
              <p className="font-semibold" style={{ color: COLORS.text }}>New Jersey, USA</p>
            </div>
            <div 
              className="rounded-xl p-4 text-center"
              style={{ backgroundColor: COLORS.highlight }}
            >
              <Users size={20} color={COLORS.accent} className="mx-auto mb-2" />
              <p className="text-xs" style={{ color: COLORS.subtext }}>Ownership</p>
              <p className="font-semibold" style={{ color: COLORS.text }}>Minority & Woman-Owned</p>
            </div>
          </div>
        </div>

        {/* Management Team Section */}
        <div className="mb-10">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Sparkles size={24} color={COLORS.gold} />
              <h2 
                className="text-3xl font-bold"
                style={{ 
                  fontFamily: "'EB Garamond', Georgia, serif",
                  color: COLORS.text,
                }}
              >
                Management Team
              </h2>
              <Sparkles size={24} color={COLORS.gold} />
            </div>
            <p style={{ color: COLORS.subtext }}>
              Two sisters, one vision
            </p>
          </div>

          {/* Jacqueline Bio */}
          <div 
            className="rounded-2xl p-8 mb-6 shadow-lg"
            style={{ 
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.borderStrong}`,
            }}
          >
            <div className="flex flex-col md:flex-row gap-8">
              {/* Photo */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <div 
                  className="w-48 h-48 rounded-2xl overflow-hidden shadow-lg"
                  style={{ border: `3px solid ${COLORS.gold}` }}
                >
                  <img
                    src="/assets/jacqueline-photo.jpg"
                    alt="Jacqueline Session Ausby"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div 
                    className="w-full h-full items-center justify-center hidden"
                    style={{ 
                      background: `linear-gradient(135deg, ${COLORS.gold} 0%, #B8962E 100%)`,
                    }}
                  >
                    <span style={{ color: "white", fontSize: "4rem", fontFamily: "'EB Garamond', Georgia, serif" }}>J</span>
                  </div>
                </div>
              </div>
              
              {/* Bio Content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <BookOpen size={20} color={COLORS.gold} />
                  <span 
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: COLORS.gold }}
                  >
                    Author, CEO & Founder
                  </span>
                </div>
                <h3 
                  className="text-2xl font-bold mb-4"
                  style={{ 
                    fontFamily: "'EB Garamond', Georgia, serif",
                    color: COLORS.text,
                  }}
                >
                  Jacqueline Session Ausby
                </h3>
                
                <div className="space-y-4 text-sm" style={{ color: COLORS.text, lineHeight: 1.8 }}>
                  <p>
                    Jacqueline Session Ausby is an author, creative entrepreneur, and leadership specialist with over 
                    30 years of experience providing executive support to senior leaders across corporate and government 
                    sectors. Her career includes a decade at Deloitte where she managed the CEO Executive Transition Lab 
                    Program, delivering sessions for CEOs, BU Leaders, and Government officials worldwide. Now at GSK, 
                    she supports R&D executives while continuing to mentor creative professionals.
                  </p>
                  
                  <p>
                    Jacqueline combines corporate precision with creative purpose. Her background in English Writing (B.A.) 
                    and Creative Writing (M.A.) shapes the philosophy behind DAHTRUTH: to turn every story into strategy 
                    and every writer into a leader.
                  </p>
                  
                  <p>
                    She has published <em>That Sommer Day in Sodom</em> and <em>Grace & Mercy for the Unrighteous</em>, 
                    and is currently completing two novellas—<em>Promise Me June</em> and <em>Raising Daisy</em>. She founded 
                    DahTruth.com in 2017 as a platform for faith-based and social-commentary writing, which has since evolved 
                    into DAHTRUTH Story Lab.
                  </p>
                  
                  <p 
                    className="italic pt-2"
                    style={{ 
                      color: COLORS.accent,
                      borderTop: `1px solid ${COLORS.border}`,
                    }}
                  >
                    "Her vision for DAHTRUTH is to spark a 21st-century Harlem Renaissance that uplifts urban voices 
                    while embracing diversity worldwide."
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Crystal Bio */}
          <div 
            className="rounded-2xl p-8 shadow-lg"
            style={{ 
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.borderStrong}`,
            }}
          >
            <div className="flex flex-col md:flex-row gap-8">
              {/* Photo */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <div 
                  className="w-48 h-48 rounded-2xl overflow-hidden shadow-lg"
                  style={{ border: `3px solid ${COLORS.accent}` }}
                >
                  <img
                    src="/assets/crystal-photo.jpg"
                    alt="Crystal Session"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div 
                    className="w-full h-full items-center justify-center hidden"
                    style={{ 
                      background: `linear-gradient(135deg, ${COLORS.accent} 0%, #264A75 100%)`,
                    }}
                  >
                    <span style={{ color: "white", fontSize: "4rem", fontFamily: "'EB Garamond', Georgia, serif" }}>C</span>
                  </div>
                </div>
              </div>
              
              {/* Bio Content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <Briefcase size={20} color={COLORS.accent} />
                  <span 
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: COLORS.accent }}
                  >
                    Operations Director & COO
                  </span>
                </div>
                <h3 
                  className="text-2xl font-bold mb-4"
                  style={{ 
                    fontFamily: "'EB Garamond', Georgia, serif",
                    color: COLORS.text,
                  }}
                >
                  Crystal Session
                </h3>
                
                <div className="space-y-4 text-sm" style={{ color: COLORS.text, lineHeight: 1.8 }}>
                  <p>
                    Crystal Session brings over 30 years of experience in sales and customer relations within the 
                    insurance industry, serving agents and agencies throughout the region. Her background in client 
                    support and business operations makes her a natural fit for DAHTRUTH's logistical and customer-care needs.
                  </p>
                  
                  <p>
                    Crystal manages event planning, vendor relations, and participant coordination for workshops and retreats. 
                    Her leadership ensures each event runs with professional excellence and hospitality.
                  </p>
                  
                  <p 
                    className="italic pt-2"
                    style={{ 
                      color: COLORS.accent,
                      borderTop: `1px solid ${COLORS.border}`,
                    }}
                  >
                    "She is deeply committed to mentoring young professionals and supporting DAHTRUTH's mission to 
                    create space for voices that might otherwise go unheard."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          
          {/* Mission */}
          <div 
            className="rounded-2xl p-8 shadow-lg"
            style={{ 
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.borderStrong}`,
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div 
                className="w-12 h-12 rounded-xl grid place-items-center"
                style={{ 
                  background: `linear-gradient(135deg, ${COLORS.gold} 0%, #B8962E 100%)`,
                }}
              >
                <Target size={24} color="white" />
              </div>
              <h2 
                className="text-2xl font-bold"
                style={{ 
                  fontFamily: "'EB Garamond', Georgia, serif",
                  color: COLORS.text,
                }}
              >
                Our Mission
              </h2>
            </div>
            <p style={{ color: COLORS.text, lineHeight: 1.8 }}>
              To empower individuals to share their stories with structure, creativity, and confidence 
              through innovative, faith-rooted, technology-driven tools.
            </p>
          </div>

          {/* Vision */}
          <div 
            className="rounded-2xl p-8 shadow-lg"
            style={{ 
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.borderStrong}`,
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div 
                className="w-12 h-12 rounded-xl grid place-items-center"
                style={{ 
                  background: `linear-gradient(135deg, ${COLORS.accent} 0%, #264A75 100%)`,
                }}
              >
                <Eye size={24} color="white" />
              </div>
              <h2 
                className="text-2xl font-bold"
                style={{ 
                  fontFamily: "'EB Garamond', Georgia, serif",
                  color: COLORS.text,
                }}
              >
                Our Vision
              </h2>
            </div>
            <p style={{ color: COLORS.text, lineHeight: 1.8 }}>
              To build a global community where every story finds its audience and every writer—regardless 
              of background—can transform imagination into impact.
            </p>
          </div>
        </div>

        {/* Tagline Banner */}
        <div 
          className="rounded-2xl p-8 mb-10 text-center shadow-lg"
          style={{ 
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
          }}
        >
          <Sparkles size={32} color={COLORS.gold} className="mx-auto mb-4" />
          <h2 
            className="text-2xl font-bold mb-3"
            style={{ 
              fontFamily: "'EB Garamond', Georgia, serif",
              color: COLORS.white,
            }}
          >
            Where Every Story Matters
          </h2>
          <p 
            className="text-lg max-w-xl mx-auto"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            We believe that everyone has a story worth telling. Our mission is to provide the tools, 
            community, and support to help you tell yours.
          </p>
        </div>

        {/* Contact CTA */}
        <div 
          className="rounded-2xl p-8 text-center shadow-lg"
          style={{ 
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.borderStrong}`,
          }}
        >
          <Heart size={32} color={COLORS.gold} className="mx-auto mb-4" />
          <h2 
            className="text-2xl font-bold mb-3"
            style={{ 
              fontFamily: "'EB Garamond', Georgia, serif",
              color: COLORS.text,
            }}
          >
            Get in Touch
          </h2>
          <p className="mb-6" style={{ color: COLORS.subtext }}>
            Have questions or want to learn more about DAHTRUTH? We'd love to hear from you.
          </p>
          <a
            href="mailto:hello@dahtruth.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-90 shadow-md"
            style={{ 
              backgroundColor: COLORS.gold,
              color: COLORS.white,
            }}
          >
            <Mail size={18} />
            hello@dahtruth.com
          </a>
        </div>

      </div>
    </div>
  );
}

