import Link from "next/link";
import { Mail, Phone, MapPin, Share2, ExternalLink, Rss } from "lucide-react";
import NewsletterForm from "@/components/ui/NewsletterForm";

const footerLinks = {
  News: [
    { name: "Politics", href: "/category/politics" },
    { name: "Business", href: "/category/business" },
    { name: "Sports", href: "/category/sports" },
    { name: "Entertainment", href: "/category/entertainment" },
    { name: "Technology", href: "/category/technology" },
    { name: "Health", href: "/category/health" },
  ],
  Company: [
    { name: "About Us", href: "#" },
    { name: "Our Team", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Advertise", href: "#" },
    { name: "Contact Us", href: "#" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Use", href: "#" },
    { name: "Cookie Policy", href: "#" },
    { name: "Editorial Policy", href: "#" },
    { name: "Corrections", href: "#" },
  ],
};

const socialLinks = [
  { label: "Facebook", href: "https://facebook.com", color: "hover:bg-blue-600", letter: "f" },
  { label: "Twitter / X", href: "https://twitter.com", color: "hover:bg-slate-600", letter: "𝕏" },
  { label: "Instagram", href: "https://instagram.com", color: "hover:bg-pink-600", letter: "ig" },
  { label: "YouTube", href: "https://youtube.com", color: "hover:bg-red-600", letter: "▶" },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Newsletter */}
      <div className="bg-red-700 py-10">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-white text-2xl font-bold mb-2" style={{ fontFamily: "Georgia, serif" }}>
            Stay Informed. Stay Ahead.
          </h3>
          <p className="text-red-100 mb-6 font-sans text-sm">
            Get the latest Kenya news delivered directly to your inbox every morning.
          </p>
          <NewsletterForm variant="footer" />
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-red-700 rounded flex items-center justify-center">
                <span className="text-white font-bold">KB</span>
              </div>
              <div>
                <span className="text-white text-xl font-bold" style={{ fontFamily: "Georgia, serif" }}>
                  The Kenya Brief
                </span>
                <p className="text-red-400 text-xs font-sans tracking-wide">TRUTH. CLARITY. IMPACT.</p>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 font-sans">
              Kenya&apos;s most trusted news platform. We deliver accurate, timely, and insightful journalism
              that keeps citizens informed about the issues that matter most.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ label, href, color, letter }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className={`w-8 h-8 bg-gray-800 ${color} rounded-full flex items-center justify-center transition-colors text-xs font-bold`}
                  aria-label={label}>
                  {letter}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4 font-sans">{section}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-gray-400 hover:text-white text-sm transition-colors font-sans">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="border-t border-gray-800 mt-10 pt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 text-sm font-sans">
            <MapPin size={16} className="text-red-500 shrink-0" />
            <span className="text-gray-400">Waiyaki Way, Westlands, Nairobi, Kenya</span>
          </div>
          <div className="flex items-center gap-3 text-sm font-sans">
            <Phone size={16} className="text-red-500 shrink-0" />
            <span className="text-gray-400">+254 700 000 000</span>
          </div>
          <div className="flex items-center gap-3 text-sm font-sans">
            <Mail size={16} className="text-red-500 shrink-0" />
            <span className="text-gray-400">news@kenyabrief.co.ke</span>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800 py-4">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-gray-500 font-sans">
          <p>© {new Date().getFullYear()} The Kenya Brief. All rights reserved.</p>
          <p>Committed to accurate, impartial journalism serving all Kenyans.</p>
        </div>
      </div>
    </footer>
  );
}
