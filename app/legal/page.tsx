import NavBar from '@/components/nav/NavBar';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-20 pt-32">
        <h1 className="text-4xl font-bold mb-8">Legal</h1>
        <p className="text-muted-foreground">Legal information will be added here.</p>
      </div>
    </div>
  );
}

