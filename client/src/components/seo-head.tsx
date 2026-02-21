import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSettings } from "@/hooks/use-settings";

export function JsonLdScript({ data }: { data: any }) {
  useEffect(() => {
    if (!data) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [data]);
  return null;
}

export function ProductJsonLd({ slug }: { slug: string }) {
  const { data } = useQuery({ queryKey: ["/api/jsonld/product", slug], enabled: !!slug });
  return data ? <JsonLdScript data={data} /> : null;
}

export default function SeoHead() {
  const { getSetting, isLoading } = useSettings();
  const { data: orgJsonLd } = useQuery({ queryKey: ["/api/jsonld/organization"] });

  useEffect(() => {
    if (isLoading) return;

    const seoTitle = getSetting("seo_title") || getSetting("site_name") || "FitSupp";
    const seoDescription = getSetting("seo_description") || getSetting("site_description") || "";
    const seoKeywords = getSetting("seo_keywords") || "";
    const ogImage = getSetting("og_image") || "";
    const favicon = getSetting("favicon_url") || "";

    document.title = seoTitle;

    const setMeta = (name: string, content: string, attr: string = "name") => {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta("description", seoDescription);
    setMeta("keywords", seoKeywords);
    setMeta("og:title", seoTitle, "property");
    setMeta("og:description", seoDescription, "property");
    setMeta("og:type", "website", "property");
    if (ogImage) setMeta("og:image", ogImage, "property");
    setMeta("twitter:card", "summary_large_image", "name");
    setMeta("twitter:title", seoTitle, "name");
    setMeta("twitter:description", seoDescription, "name");

    if (favicon) {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = favicon;
    }
  }, [getSetting, isLoading]);

  return orgJsonLd ? <JsonLdScript data={orgJsonLd} /> : null;
}
