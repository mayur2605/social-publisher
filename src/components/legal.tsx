import Link from "next/link";
export function Legal({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="legal-page">
      <Link href="/">← Social Publisher</Link>
      <h1>{title}</h1>
      {!process.env.LEGAL_ENTITY_NAME && (
        <p>
          This pre-launch policy identifies the app’s current behavior. Operator
          details must be completed before public launch.
        </p>
      )}
      {children}
      <h2>Contact</h2>
      <p>
        {process.env.LEGAL_ENTITY_NAME ||
          "Social Publisher operator details pending"}
      </p>
      {process.env.SUPPORT_EMAIL ? (
        <a href={`mailto:${process.env.SUPPORT_EMAIL}`}>
          {process.env.SUPPORT_EMAIL}
        </a>
      ) : (
        <p>
          A support contact will be published before public registration opens.
        </p>
      )}
      <p>
        <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link>{" "}
        · <Link href="/data-deletion">Data deletion</Link>
      </p>
    </main>
  );
}
