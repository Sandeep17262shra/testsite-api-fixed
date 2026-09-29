import Link from "next/link";
import styles from "./page.module.css";

export const metadata = {
  title: "Keyideas Ring Configurator",
  description:
    "A standalone 3D ring customization experience for jewelry brands and ecommerce stores.",
};

const features = [
  {
    marker: "3D",
    title: "Real-time ring preview",
    description:
      "Inspect the configured ring from every angle while visual selections update in the viewer.",
  },
  {
    marker: "RS",
    title: "Ring style customization",
    description:
      "Present supported shank and design options in a focused, visual selection flow.",
  },
  {
    marker: "DC",
    title: "Diamond shape and carat",
    description:
      "Compare supported diamond profiles and carat sizes without leaving the configuration page.",
  },
  {
    marker: "MP",
    title: "Metal and purity choices",
    description:
      "Preview platinum and white, yellow, or rose gold across the available purity options.",
  },
  {
    marker: "HS",
    title: "Head and setting styles",
    description:
      "Offer compatible prong, halo, bezel, and three-stone settings safely within the viewer.",
  },
  {
    marker: "MB",
    title: "Matching band support",
    description:
      "Add a supported matching band and reflect that selection in the current visual and total.",
  },
  {
    marker: "FE",
    title: "Frontend-first architecture",
    description:
      "Run the demo as a standalone experience without requiring a commerce backend or cart API.",
  },
  {
    marker: "IF",
    title: "Simple iframe integration",
    description:
      "Place the configurator inside an existing product, campaign, or demonstration page.",
  },
];

const steps = [
  {
    title: "Choose ring style",
    description: "Start with a supported shank and design profile.",
  },
  {
    title: "Select the diamond",
    description: "Compare shape options and choose the preferred carat.",
  },
  {
    title: "Pick the setting",
    description: "Select a compatible head or setting style for the ring.",
  },
  {
    title: "Choose the finish",
    description: "Set metal, purity, and an optional matching band.",
  },
  {
    title: "Review and continue",
    description: "Confirm the configuration and current demo price.",
  },
];

const iframeExample =
  '<iframe src="https://next-frontend-app-one.vercel.app/" style="width:100%;height:850px;border:0;"></iframe>';

export default function RingConfiguratorOverview() {
  return (
    <div className={styles.page}>
      <header className={styles.siteHeader}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/ring-configurator">
            <span className={styles.brandMark}>K</span>
            <span>Keyideas</span>
          </Link>
          <nav className={styles.nav} aria-label="Overview navigation">
            <a href="#overview">Overview</a>
            <a href="#live-demo">Live demo</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#integration">Integration</a>
          </nav>
          <Link className={styles.headerCta} href="/">
            Launch demo
          </Link>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroTexture} aria-hidden="true" />
          <div className={styles.heroInner}>
            <p className={styles.eyebrow}>Jewelry visualization platform</p>
            <h1>Keyideas Ring Configurator</h1>
            <p className={styles.heroLead}>
              A standalone 3D customization experience that helps jewelry
              shoppers explore a ring visually before moving to the next step.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryButton} href="/">
                Launch Demo
              </Link>
              <a className={styles.secondaryButton} href="#live-demo">
                View Live Configurator
              </a>
            </div>
            <p className={styles.platformNote}>
              Demo-friendly integration for Shopify, WooCommerce, and custom
              storefronts.
            </p>
          </div>
          <div className={styles.heroFacts}>
            <div>
              <span>Viewer</span>
              <strong>Interactive 3D</strong>
            </div>
            <div>
              <span>Experience</span>
              <strong>Frontend-first</strong>
            </div>
            <div>
              <span>Integration</span>
              <strong>Iframe ready</strong>
            </div>
            <div>
              <span>Updates</span>
              <strong>Visual and pricing</strong>
            </div>
          </div>
        </section>

        <section className={styles.section} id="overview">
          <div className={styles.splitIntro}>
            <div>
              <p className={styles.eyebrow}>Product overview</p>
              <h2>Turn ring options into a visual buying experience.</h2>
            </div>
            <div className={styles.prose}>
              <p>
                Keyideas Ring Configurator gives shoppers a clear way to build
                and inspect a ring setting before continuing through a store's
                buying journey.
              </p>
              <p>
                Customers can explore ring style, diamond shape, carat, head or
                setting style, ring metal, and a matching band. The standalone
                viewer updates the 3D model and demo pricing as selections
                change.
              </p>
              <div className={styles.detailList}>
                <span>Responsive viewer</span>
                <span>Compatible option handling</span>
                <span>Standalone demo deployment</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.demoSection} id="live-demo">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Live product demo</p>
              <h2>The configurator is the product experience.</h2>
            </div>
            <div className={styles.sectionAside}>
              <p>
                Explore the working standalone interface below. The viewer,
                option controls, and current pricing behavior are rendered from
                the same app available at the root route.
              </p>
              <Link
                className={styles.outlineButton}
                href="/"
                target="_blank"
                rel="noreferrer"
              >
                Open Full Demo
              </Link>
            </div>
          </div>
          <div className={styles.demoFrame}>
            <div className={styles.browserBar} aria-hidden="true">
              <div className={styles.browserDots}>
                <span />
                <span />
                <span />
              </div>
              <div className={styles.addressBar}>
                next-frontend-app-one.vercel.app
              </div>
              <span className={styles.browserStatus}>Live demo</span>
            </div>
            <iframe
              className={styles.demoIframe}
              src="/"
              title="Keyideas Ring Configurator live demo"
              loading="lazy"
            />
          </div>
          <div className={styles.demoCaption}>
            <span>Rendered from the standalone Next.js application.</span>
            <strong>No backend required for this demo.</strong>
          </div>
        </section>

        <section className={styles.section} id="capabilities">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>App capabilities</p>
              <h2>Every control supports a clearer ring decision.</h2>
            </div>
            <p className={styles.headingCopy}>
              A focused set of visual tools for product exploration, presented
              in one consistent configuration workflow.
            </p>
          </div>
          <div className={styles.featureGrid}>
            {features.map((feature) => (
              <article className={styles.featureCard} key={feature.marker}>
                <span className={styles.featureMarker}>{feature.marker}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.howSection}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>How it works</p>
              <h2>Five clear choices. One configured ring.</h2>
            </div>
            <p className={styles.headingCopy}>
              The experience keeps the ring visible while shoppers move from
              design decisions to a complete demo configuration.
            </p>
          </div>
          <ol className={styles.steps}>
            {steps.map((step, index) => (
              <li key={step.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.integrationBand} id="integration">
          <div className={styles.integrationSection}>
            <div className={styles.integrationCopy}>
              <p className={styles.eyebrow}>Storefront integration</p>
              <h2>Embed the standalone app where shoppers need it.</h2>
              <p>
                The current deployment can be placed inside WooCommerce,
                Shopify, or a custom storefront through an iframe. This keeps
                the demo independent from backend, cart, and catalog APIs while
                leaving room for a future store-specific handoff.
              </p>
              <div className={styles.platforms} aria-label="Supported platforms">
                <span>WooCommerce</span>
                <span>Shopify</span>
                <span>Custom storefronts</span>
              </div>
            </div>
            <div className={styles.codePanel}>
              <div className={styles.embedFlow} aria-label="Iframe embed flow">
                <span>Standalone app</span>
                <i aria-hidden="true">to</i>
                <span>Iframe embed</span>
                <i aria-hidden="true">to</i>
                <span>Storefront page</span>
              </div>
              <div className={styles.codeHeader}>
                <span>Iframe example</span>
                <span>HTML</span>
              </div>
              <pre>
                <code>{iframeExample}</code>
              </pre>
            </div>
          </div>
        </section>

        <section className={styles.platformSection}>
          <div className={styles.platformHeading}>
            <div>
              <p className={styles.eyebrow}>Portable by design</p>
              <h2>Works with the storefront you already operate.</h2>
            </div>
            <p>
              Keep the configurator deployment independent, then place it in
              the right customer-facing page for each platform.
            </p>
          </div>
          <div className={styles.platformGrid}>
            <div>
              <span>Plugin ecosystem</span>
              <h3>WooCommerce</h3>
              <p>Embed the standalone experience in a WordPress product or demo page.</p>
            </div>
            <div>
              <span>Hosted commerce</span>
              <h3>Shopify</h3>
              <p>Present the iframe inside a theme section or dedicated landing page.</p>
            </div>
            <div>
              <span>Framework agnostic</span>
              <h3>Custom websites</h3>
              <p>Use the same hosted app in React, Next.js, Laravel, or another stack.</p>
            </div>
          </div>
        </section>

        <section className={styles.finalCta}>
          <p className={styles.eyebrow}>Launch the experience</p>
          <h2>Let shoppers see the ring come together.</h2>
          <p>
            Open the working configurator or use the integration example to
            place the standalone demo on a jewelry storefront.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href="/">
              Launch Configurator
            </Link>
            <a className={styles.secondaryButtonDark} href="#integration">
              View Integration
            </a>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>Keyideas Ring Configurator</span>
        <span>Standalone 3D jewelry configuration demo</span>
      </footer>
    </div>
  );
}
