// @ts-nocheck
/* eslint-disable */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const categoriesData = [
    { name: "Politics", slug: "politics", color: "#DC2626", icon: "🏛️", sortOrder: 1 },
    { name: "Business", slug: "business", color: "#2563EB", icon: "💼", sortOrder: 2 },
    { name: "Sports", slug: "sports", color: "#16A34A", icon: "⚽", sortOrder: 3 },
    { name: "Entertainment", slug: "entertainment", color: "#9333EA", icon: "🎬", sortOrder: 4 },
    { name: "Lifestyle", slug: "lifestyle", color: "#F59E0B", icon: "🌿", sortOrder: 5 },
    { name: "Technology", slug: "technology", color: "#0EA5E9", icon: "💻", sortOrder: 6 },
    { name: "Health", slug: "health", color: "#10B981", icon: "🏥", sortOrder: 7 },
    { name: "World", slug: "world", color: "#EF4444", icon: "🌐", sortOrder: 8 },
    { name: "Education", slug: "education", color: "#6366F1", icon: "📚", sortOrder: 9 },
    { name: "Environment", slug: "environment", color: "#84CC16", icon: "🌍", sortOrder: 10 },
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categories[cat.slug] = c;
    console.log(`✅ Category: ${cat.name}`);
  }

  const adminPassword = await bcrypt.hash("Admin@1234", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@kenyabrief.co.ke" },
    update: {},
    create: { name: "Admin User", email: "admin@kenyabrief.co.ke", password: adminPassword, role: "ADMIN", bio: "Platform administrator" },
  });
  console.log("✅ Admin: admin@kenyabrief.co.ke / Admin@1234");

  const seniorPassword = await bcrypt.hash("Editor@1234", 12);
  const seniorEditor = await prisma.user.upsert({
    where: { email: "senior@kenyabrief.co.ke" },
    update: {},
    create: { name: "Jane Wanjiku", email: "senior@kenyabrief.co.ke", password: seniorPassword, role: "SENIOR_EDITOR", bio: "Senior Editor, Politics & Business" },
  });
  console.log("✅ Senior Editor: senior@kenyabrief.co.ke / Editor@1234");

  const juniorPassword = await bcrypt.hash("Junior@1234", 12);
  const juniorEditor = await prisma.user.upsert({
    where: { email: "junior@kenyabrief.co.ke" },
    update: {},
    create: { name: "Brian Omondi", email: "junior@kenyabrief.co.ke", password: juniorPassword, role: "JUNIOR_EDITOR", bio: "Junior Editor, Sports & Entertainment" },
  });
  console.log("✅ Junior Editor: junior@kenyabrief.co.ke / Junior@1234");

  const tagsData = ["Kenya","Nairobi","Government","Economy","Elections","Football","Athletics","Ruto","Parliament","Business","Technology","Health","Education","Climate","Africa"];
  const tags = {};
  for (const tagName of tagsData) {
    const slug = tagName.toLowerCase().replace(/\s+/g, "-");
    const t = await prisma.tag.upsert({ where: { slug }, update: {}, create: { name: tagName, slug } });
    tags[tagName] = t;
  }
  console.log("✅ Tags created");

  const articles = [
    {
      title: "Kenya's Economy Shows Strong Recovery Signs in Q2 2026",
      slug: "kenya-economy-strong-recovery-q2-2026",
      excerpt: "Kenya's GDP expanded by 5.8% in Q2 2026, outpacing analyst forecasts driven by robust growth in agriculture and the tech sector.",
      content: `<p>Kenya's economy demonstrated remarkable resilience in the second quarter of 2026, with GDP growth reaching 5.8%.</p>
<p>The expansion was driven by strong performances in the agricultural sector following favorable weather conditions, and a booming technology ecosystem in Nairobi's Silicon Savannah.</p>
<h2>Key Growth Drivers</h2>
<p>Agriculture, which accounts for roughly 25% of Kenya's GDP, grew by 7.2% as improved rainfall patterns boosted crop yields. Tea exports to European and Asian markets reached record levels, contributing significantly to foreign exchange earnings.</p>
<p>The technology and financial services sector continued its trajectory. Mobile money transactions through M-Pesa exceeded KSh 8 trillion in the first half of 2026, reflecting deepening financial inclusion.</p>
<h2>Government Response</h2>
<p>Treasury Cabinet Secretary John Mbadi expressed cautious optimism about the growth trajectory, noting that fiscal consolidation measures were beginning to bear fruit.</p>`,
      categorySlug: "business",
      authorId: seniorEditor.id,
      isFeatured: true, isTrending: true, isBreaking: false,
      status: "PUBLISHED", readTime: 4, viewCount: 3420,
      tagNames: ["Kenya","Economy","Business"],
    },
    {
      title: "Harambee Stars Book AFCON 2027 Qualifying Spot with Late Drama",
      slug: "harambee-stars-afcon-2027-qualifying-spot",
      excerpt: "Kenya's national football team secured a crucial win over Uganda, booking their place at AFCON 2027 to be held in Morocco.",
      content: `<p>In a pulsating encounter at Nyayo National Stadium on Saturday evening, Harambee Stars beat Uganda 2-1 to secure qualification for AFCON 2027.</p>
<p>The match was decided by a stunning 89th-minute strike from Kenneth Muguna, sending the stadium into delirium.</p>
<h2>Match Report</h2>
<p>Uganda drew first blood in the 23rd minute. Kenya equalized just before halftime through captain Michael Olunga, his 34th international goal.</p>
<h2>Coach's Reaction</h2>
<p>Head coach Engin Firat was emotional: "This team never gave up. The spirit these players showed tonight is what Kenyan football is all about."</p>`,
      categorySlug: "sports",
      authorId: juniorEditor.id,
      isFeatured: true, isTrending: true, isBreaking: true,
      status: "PUBLISHED", readTime: 3, viewCount: 5680,
      tagNames: ["Football","Kenya"],
    },
    {
      title: "Parliament Passes Landmark Digital Economy Bill 2026",
      slug: "parliament-passes-digital-economy-bill-2026",
      excerpt: "MPs voted overwhelmingly to pass the Digital Economy Bill 2026, establishing a regulatory framework for e-commerce, digital currencies, and AI in Kenya.",
      content: `<p>Kenya's National Assembly passed the Digital Economy Bill 2026 with 289 votes in favour, in a historic step positioning Kenya as a leading tech investment destination.</p>
<h2>Key Provisions</h2>
<p>The legislation creates a Digital Asset Exchange, regulating cryptocurrency trading and Central Bank Digital Currency transactions. The Central Bank of Kenya has been working on a digital shilling pilot for 18 months.</p>
<p>The bill also introduces mandatory data protection requirements for businesses with more than 1,000 Kenyan users.</p>`,
      categorySlug: "politics",
      authorId: seniorEditor.id,
      isFeatured: false, isTrending: true, isBreaking: false,
      status: "PUBLISHED", readTime: 5, viewCount: 2180,
      tagNames: ["Kenya","Parliament","Technology","Government"],
    },
    {
      title: "Nairobi City Festival 2026: Five Days of Music, Art and Culture",
      slug: "nairobi-city-festival-2026-music-art-culture",
      excerpt: "The annual Nairobi City Festival returns bigger than ever, featuring over 200 local and international artists at Uhuru Park from June 5–9.",
      content: `<p>The Nairobi City Festival is back for its 12th edition, featuring five days of entertainment celebrating Kenya's rich cultural tapestry.</p>
<p>Running from June 5–9 at Uhuru Park, this year's festival features Burna Boy, Sauti Sol, and rising star Nikita Kering.</p>
<h2>Festival Highlights</h2>
<p>The Main Stage hosts headline concerts each evening, while the Village Stage showcases emerging Kenyan talent. For the first time, the festival introduces a dedicated Spoken Word Arena.</p>`,
      categorySlug: "entertainment",
      authorId: juniorEditor.id,
      isFeatured: true, isTrending: false, isBreaking: false,
      status: "PUBLISHED", readTime: 3, viewCount: 1890,
      tagNames: ["Nairobi","Kenya"],
    },
    {
      title: "Kenya Launches Free Universal Health Coverage Programme",
      slug: "kenya-free-universal-health-coverage-programme",
      excerpt: "President Ruto officially launches the Social Health Authority programme, extending free primary healthcare to all 54 million Kenyans from July 2026.",
      content: `<p>President William Ruto officially launched Kenya's Universal Health Coverage programme on Monday, administered through the Social Health Authority (SHA).</p>
<p>All Kenyan citizens will be entitled to free consultations, diagnostic services, and essential medicines at Level 2, 3, and 4 public health facilities from July 1, 2026.</p>
<h2>Coverage and Benefits</h2>
<p>The programme also expands maternal health services, with free delivery and postnatal care for all women.</p>`,
      categorySlug: "health",
      authorId: admin.id,
      isFeatured: true, isTrending: true, isBreaking: false,
      status: "PUBLISHED", readTime: 5, viewCount: 4320,
      tagNames: ["Kenya","Government","Health"],
    },
    {
      title: "Silicon Savannah Startups Raise Record $450M in H1 2026",
      slug: "silicon-savannah-startups-raise-record-450m-h1-2026",
      excerpt: "Nairobi-based tech startups attracted a record $450 million in venture capital funding in H1 2026, cementing Kenya's position as Africa's premier tech hub.",
      content: `<p>Nairobi's technology ecosystem hit a new milestone, with startups raising $450 million in venture capital in the first six months of 2026, a 67% increase over 2025.</p>
<h2>Leading Deals</h2>
<p>The biggest deal was a $120 million Series C raised by AfyaTech, an AI-powered diagnostic tools company. Fintech accounted for 42% of all funding.</p>`,
      categorySlug: "technology",
      authorId: seniorEditor.id,
      isFeatured: false, isTrending: true, isBreaking: false,
      status: "PUBLISHED", readTime: 4, viewCount: 2760,
      tagNames: ["Kenya","Technology","Business","Nairobi"],
    },
    {
      title: "Mount Kenya Glaciers Could Disappear by 2040, Scientists Warn",
      slug: "mount-kenya-glaciers-disappear-2040-scientists-warn",
      excerpt: "New research shows Mount Kenya's glaciers, which have shrunk by 92% since 1900, could vanish entirely within 15 years.",
      content: `<p>Scientists at the University of Nairobi warn that Mount Kenya's remaining glaciers could disappear entirely by 2040.</p>
<p>New satellite data documents a catastrophic 92% reduction in glacier coverage since 1900. The remaining 0.4 square kilometres is at severe risk.</p>
<h2>Ecological Implications</h2>
<p>The loss would have severe consequences for agriculture and drinking water in central Kenya, where the Tana and Ewaso Ng'iro rivers originate. Approximately 2 million people rely on these water sources.</p>`,
      categorySlug: "environment",
      authorId: seniorEditor.id,
      isFeatured: false, isTrending: false, isBreaking: false,
      status: "PUBLISHED", readTime: 4, viewCount: 980,
      tagNames: ["Kenya","Climate","Africa"],
    },
    {
      title: "Eliud Kipchoge Eyes Record Fifth London Marathon Title",
      slug: "kipchoge-record-fifth-london-marathon-2026",
      excerpt: "Marathon legend Eliud Kipchoge has confirmed his entry for the 2026 London Marathon, targeting a record-extending fifth title.",
      content: `<p>Marathon legend Eliud Kipchoge has confirmed he will race at the 2026 London Marathon on April 26, targeting a fifth title.</p>
<p>Kipchoge, who holds the world marathon record of 2:00:35 set in Berlin in 2023, has four previous London wins (2015, 2016, 2018, 2019).</p>
<h2>Preparation</h2>
<p>"London is always special for me. The crowd, the route, the history — it all inspires me," Kipchoge said at a press conference in Eldoret.</p>`,
      categorySlug: "sports",
      authorId: juniorEditor.id,
      isFeatured: false, isTrending: false, isBreaking: false,
      status: "PUBLISHED", readTime: 3, viewCount: 3150,
      tagNames: ["Athletics","Kenya"],
    },
  ];

  for (const articleData of articles) {
    const { tagNames, categorySlug, ...data } = articleData;
    const category = categories[categorySlug];
    if (!category) { console.log(`⚠️  Category not found: ${categorySlug}`); continue; }
    const existing = await prisma.article.findUnique({ where: { slug: data.slug } });
    if (existing) { console.log(`ℹ️  Article exists: ${data.title}`); continue; }
    const tagConnections = (tagNames || []).filter(n => tags[n]).map(n => ({ tagId: tags[n].id }));
    await prisma.article.create({
      data: {
        ...data,
        categoryId: category.id,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
        metaTitle: data.title,
        metaDescription: data.excerpt,
        tags: { create: tagConnections },
      },
    });
    console.log(`✅ Article: ${data.title}`);
  }

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📋 Login Credentials:");
  console.log("   Admin:         admin@kenyabrief.co.ke  /  Admin@1234");
  console.log("   Senior Editor: senior@kenyabrief.co.ke /  Editor@1234");
  console.log("   Junior Editor: junior@kenyabrief.co.ke /  Junior@1234");
}

main()
  .catch((e) => { console.error("❌ Seed error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
