import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

type Section = {
  title: string;
  body: string[];
};

export default function StaticInfoPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: Section[];
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-6 border-b border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "Georgia, serif" }}>{title}</h1>
            <p className="mt-3 text-gray-600 font-sans leading-relaxed max-w-3xl">{intro}</p>
          </div>
          <div className="px-6 py-6 space-y-7">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-bold text-gray-900 mb-2 font-sans">{section.title}</h2>
                <div className="space-y-3">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-sm text-gray-600 leading-relaxed font-sans">{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
