import type { CompanyData } from "@/lib/icp/scoring-engine";

interface ApolloOrganization {
  name?: string;
  industry?: string;
  estimated_num_employees?: number;
  annual_revenue?: number;
  country?: string;
  city?: string;
  state?: string;
  short_description?: string;
  keywords?: string[];
  technology_names?: string[];
  [key: string]: unknown;
}

/**
 * Enrich company data via Apollo.io API.
 * Falls back gracefully when API key is not configured.
 */
export async function enrichWithApollo(
  companyData: CompanyData
): Promise<{ enriched: CompanyData; apolloData: Record<string, unknown> | null }> {
  const apiKey = process.env.APOLLO_API_KEY;

  if (!apiKey) {
    return {
      enriched: companyData,
      apolloData: null,
    };
  }

  try {
    const domain = extractDomain(companyData.website ?? "");
    if (!domain) {
      return { enriched: companyData, apolloData: null };
    }

    const response = await fetch("https://api.apollo.io/v1/organizations/enrich", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({ domain }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { enriched: companyData, apolloData: null };
    }

    const data = await response.json();
    const org: ApolloOrganization = data.organization ?? {};

    const enriched: CompanyData = {
      ...companyData,
      name: org.name ?? companyData.name,
      industry: org.industry ?? companyData.industry,
      employeeCount: org.estimated_num_employees ?? companyData.employeeCount,
      revenue: org.annual_revenue
        ? Math.round(org.annual_revenue / 1_000_000)
        : companyData.revenue,
      country: org.country ?? companyData.country,
      location: [org.city, org.state, org.country].filter(Boolean).join(", ") || companyData.location,
      description: org.short_description ?? companyData.description,
    };

    return { enriched, apolloData: org as Record<string, unknown> };
  } catch {
    return { enriched: companyData, apolloData: null };
  }
}

function extractDomain(url: string): string | null {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
  } catch {
    return null;
  }
}
