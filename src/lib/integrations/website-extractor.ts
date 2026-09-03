import type { CompanyData } from "@/lib/icp/scoring-engine";
import { normalizeCompanyUrl } from "@/lib/utils";

/**
 * Extract company information from a website URL.
 * Uses basic HTML parsing; can be extended with Firecrawl, Puppeteer, etc.
 */
export async function extractWebsiteData(url: string): Promise<CompanyData> {
  const normalizedUrl = normalizeCompanyUrl(url);

  try {
    const response = await fetch(normalizedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; TGA-ICP-Analyzer/1.0; +https://tga.com/bot)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { website: normalizedUrl, name: extractDomainName(normalizedUrl) };
    }

    const html = await response.text();
    return parseHtmlForCompanyData(html, normalizedUrl);
  } catch {
    return {
      website: normalizedUrl,
      name: extractDomainName(normalizedUrl),
      description: "Unable to fetch website content",
    };
  }
}

function extractDomainName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    const parts = hostname.split(".");
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  } catch {
    return url;
  }
}

function parseHtmlForCompanyData(html: string, url: string): CompanyData {
  const title = extractMeta(html, "og:title") ?? extractTag(html, "title") ?? "";
  const description =
    extractMeta(html, "og:description") ??
    extractMeta(html, "description") ??
    "";

  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const textLower = textContent.toLowerCase();
  const businessModel = detectBusinessModel(textLower);
  const industry = detectIndustry(textLower);

  return {
    website: url,
    name: title.split("|")[0].split("-")[0].trim() || extractDomainName(url),
    description: description.slice(0, 500) || textContent.slice(0, 500),
    websiteContent: textContent.slice(0, 6000),
    industry,
    businessModel,
    industrySource: "heuristic",
  };
}

function extractMeta(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractTag(html: string, tag: string): string | null {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "i"));
  return match ? match[1].trim() : null;
}

function detectBusinessModel(text: string): string {
  if (text.includes("b2b") || text.includes("business to business") || text.includes("enterprise"))
    return "B2B";
  if (text.includes("b2c") || text.includes("consumer") || text.includes("shop now"))
    return "B2C";
  if (text.includes("b2b2c")) return "B2B2C";
  if (text.includes("saas") || text.includes("subscription")) return "B2B";
  return "Unknown";
}

function detectIndustry(text: string): string {
  // Manufacturing & industrial — high priority for TGA
  const industryKeywords: Record<string, string[]> = {
    Semiconductor: [
      "semiconductor",
      "semiconductors",
      "chip design",
      "chip fabrication",
      "foundry",
      "wafer",
      "ic design",
      "microprocessor",
    ],
    Manufacturing: [
      "manufacturing",
      "manufacturer",
      "factory",
      "production line",
      "oem",
      "industrial equipment",
      "machinery",
      "fabrication",
    ],
    "Industrial B2B": [
      "industrial automation",
      "industrial b2b",
      "electronics manufacturing",
      "hardware b2b",
      "precision manufacturing",
      "contract manufacturing",
    ],
    "SaaS Companies": [
      "saas",
      "software as a service",
      "cloud platform",
      "subscription",
      "per seat",
      "per rep per month",
    ],
    "IT Products": [
      "sales enablement",
      "revenue intelligence",
      "revenue ai",
      "call recording",
      "conversation intelligence",
      "deal intelligence",
      "software platform",
      "ai-powered platform",
      "ai assistant",
    ],
    AI: [
      "artificial intelligence",
      " ai ",
      "machine learning",
      "generative ai",
      "ai-powered",
    ],
    Analytics: ["analytics platform", "business intelligence", "data analytics"],
    "Cyber Security": ["cybersecurity", "cyber security", "infosec"],
    Fintech: ["fintech", "financial technology", "payments platform"],
    HRMS: ["hrms", "human resource management", "talent management software"],
  };

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some((k) => text.includes(k))) return industry;
  }

  // Lead gen agency — strict patterns only (not product sites mentioning sales terms)
  const leadGenAgencyPatterns = [
    "lead generation agency",
    "lead gen agency",
    "we generate leads for",
    "b2b lead generation services",
    "demand generation agency",
    "appointment setting services",
    "outbound lead generation services",
    "hire our sdr",
    "sales development outsourcing",
  ];
  if (leadGenAgencyPatterns.some((p) => text.includes(p))) {
    return "B2B Lead Generation";
  }

  if (text.includes("technology") || text.includes("software company")) return "IT Products";
  return "Unknown";
}
