import { PublicNavbar } from "@/components/layout/public-navbar";
import { Card, CardContent } from "@/components/ui/card";

type LegalPageProps = {
  title: string;
  updatedAt: string;
  sections: Array<[string, string]>;
};

export function LegalPage({ title, updatedAt, sections }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-slate-50">
      <PublicNavbar />
      <section className="mx-auto max-w-4xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-slate-950">{title}</h1>
        <Card>
          <CardContent className="space-y-8">
            {sections.map(([heading, body]) => (
              <section key={heading}>
                <h2 className="mb-3 text-2xl font-semibold text-slate-950">
                  {heading}
                </h2>
                <p className="leading-7 text-slate-600">{body}</p>
              </section>
            ))}
            <p className="border-t border-slate-100 pt-6 text-sm text-slate-500">
              Last updated: {updatedAt}
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
