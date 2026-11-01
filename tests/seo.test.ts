/// <reference lib="deno.ns" />

const html = Deno.readTextFileSync(new URL("../static/index.html", import.meta.url));
const metadata = new Map(Array.from(html.matchAll(/<meta\s+(?:name|property)="([^"]+)"\s+content="([^"]*)"[^>]*>/g), ([, name, content]) => [name, content]));
const canonicalUrl = "https://devpool.directory/";
const description =
  "Discover blockchain development jobs and opportunities in the DevPool network. Browse, apply, and connect with top Web3 projects at Ubiquity DAO.";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test("SEO metadata targets blockchain talent before JavaScript runs", () => {
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  assert(title === "Blockchain and Web3 Jobs | DevPool Directory", "Page title should describe blockchain and Web3 jobs");
  assert(metadata.get("description") === description, "Page description should target blockchain talent");
  for (const platform of ["og", "twitter"]) {
    assert(metadata.get(`${platform}:title`) === title, `${platform} title should match the page title`);
    assert(metadata.get(`${platform}:description`) === description, `${platform} description should match the page description`);
  }
  assert(metadata.get("keywords")?.includes("blockchain jobs"), "Keywords should target blockchain jobs");
  assert(metadata.get("keywords")?.includes("Web3"), "Keywords should target Web3 talent");
});

Deno.test("canonical and social URLs use the standard DevPool domain on either host", () => {
  assert(html.includes(`<link rel="canonical" href="${canonicalUrl}"`), "Canonical URL should use devpool.directory");
  assert(metadata.get("og:url") === canonicalUrl, "Open Graph URL should match the canonical URL");
  assert(metadata.get("twitter:url") === canonicalUrl, "Twitter URL should match the canonical URL");
  assert(metadata.get("twitter:domain") === "devpool.directory", "Twitter domain should match the canonical domain");
  for (const platform of ["og", "twitter"]) {
    const image = metadata.get(`${platform}:image`);
    assert(image && image.startsWith(canonicalUrl), `${platform} image should use the canonical domain`);
    assert(metadata.get(`${platform}:image:alt`), `${platform} image should have alternative text`);
    assert(Deno.statSync(new URL(`../static${new URL(image).pathname}`, import.meta.url)).isFile, `${platform} image should exist`);
  }
});

Deno.test("the page has one descriptive h1 and a secondary preview heading", () => {
  const headings = Array.from(html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g));
  assert(headings.length === 1, "The page should contain exactly one h1");
  assert(/blockchain.*Web3.*jobs/i.test(headings[0][1]), "The h1 should describe blockchain and Web3 jobs");
  assert(html.includes('<h2 id="preview-title">'), "The preview title should not be another h1");
});

Deno.test("organization structured data is valid JSON and uses existing canonical assets", () => {
  const schema = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert(schema, "Organization JSON-LD should be present in the initial HTML");
  const organization = JSON.parse(schema[1]);
  assert(organization["@context"] === "https://schema.org", "JSON-LD should use Schema.org");
  assert(organization["@type"] === "Organization", "JSON-LD should describe the organization");
  assert(organization.name === "Ubiquity DAO", "JSON-LD should name Ubiquity DAO");
  assert(organization.url === canonicalUrl, "Organization URL should use the canonical domain");
  assert(organization.description === description, "Organization description should match the page description");
  const logo = new URL(organization.logo);
  assert(logo.origin === new URL(canonicalUrl).origin, "Organization logo should use the canonical domain");
  assert(Deno.statSync(new URL(`../static${logo.pathname}`, import.meta.url)).isFile, "Organization logo should exist");
  assert(organization.sameAs.includes("https://twitter.com/UbiquityDAO"), "Organization should reference its social profile");
  assert(organization.sameAs.includes("https://dao.ubq.fi"), "Organization should reference the DAO website");
});

Deno.test("page icons are labeled or decorative and issue avatars have alt text", () => {
  for (const [svg] of html.matchAll(/<svg\b[^>]*>/g)) {
    assert(/aria-label="[^"]+"|aria-hidden="true"/.test(svg), "Each inline SVG should be labeled or decorative");
  }
  assert(/<button\b[^>]*class="close-preview"[^>]*aria-label="[^"]+"/.test(html), "The close-preview control should have a label");
  const issueRenderer = Deno.readTextFileSync(new URL("../src/home/rendering/render-github-issues.ts", import.meta.url));
  for (const [image] of issueRenderer.matchAll(/<img\b[^>]*>/g)) {
    assert(/\balt="[^"]*"/.test(image), "Issue avatars should have an alt attribute");
  }
});

Deno.test("the accessible page heading does not change the layout or preview heading styles", () => {
  assert(html.includes('<h1 class="sr-only">'), "The page heading should use the accessible visually-hidden class");
  const specialStyles = Deno.readTextFileSync(new URL("../static/style/special.css", import.meta.url));
  const headingStyles = specialStyles.match(/\.sr-only\s*\{([^}]+)\}/)?.[1];
  assert(headingStyles && headingStyles.includes("clip-path: inset(50%)"), "The heading should be visually clipped");
  assert(!/display:\s*none|visibility:\s*hidden/.test(headingStyles), "The heading should remain available to assistive technology");
  for (const theme of ["style", "inverted-style"]) {
    const styles = Deno.readTextFileSync(new URL(`../static/style/${theme}.css`, import.meta.url));
    assert(styles.includes(".preview #preview-title {"), `${theme} should retain the preview heading's base styling`);
    assert(styles.includes(".preview-header > a > #preview-title {"), `${theme} should retain the preview heading's header styling`);
  }
});
