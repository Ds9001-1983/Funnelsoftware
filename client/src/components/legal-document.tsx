import { Link } from "wouter";
import { usePageMeta } from "@/hooks/use-document-title";
import { getLegalDocument } from "@shared/legal-documents";
import { REGISTRATION_CONTRACT, legalDocumentUrl } from "@shared/registration-contract";

/** Nur feste, mit der Anwendung ausgelieferte Archivtexte; keine Nutzereingaben. */
export function LegalDocument({ name }: { name: "agb" | "avv" }) {
  const version = REGISTRATION_CONTRACT.version;
  const document = getLegalDocument(version, name)!;
  usePageMeta({ title: document.title, description: `${document.title} von Trichterwerk. Fassung ${version}.`, canonical: `/${name}` });
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white p-4"><Link href="/" className="underline">Zurück zur Startseite</Link></header>
      <main className="mx-auto max-w-3xl p-4 py-10 sm:p-8">
        <article className="rounded-xl border bg-white p-5 sm:p-10">
          <h1 className="text-3xl font-bold">{document.title}</h1>
          <p className="my-4 text-sm text-slate-600">Fassung: {version}</p>
          <a href={`${legalDocumentUrl(version, name)}?download=1`} className="underline">Diese Fassung als HTML speichern</a>
          <div className="prose prose-slate mt-8 max-w-none break-words [&_table]:block [&_table]:overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: document.content }} />
        </article>
      </main>
    </div>
  );
}
