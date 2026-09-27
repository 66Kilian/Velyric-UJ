// Biztonságos JSON-LD: a "<" escape-elése miatt a tartalom nem törheti meg a <script> taget.
// (Az egyetlen indokolt dangerouslySetInnerHTML: általunk szerializált adat.)
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
