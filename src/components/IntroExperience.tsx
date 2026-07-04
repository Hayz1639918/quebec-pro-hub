import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, FileText, ShieldCheck, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";

const STORAGE_KEY = "bn_intro_done_v1";
const SPLASH_MS = 1000;

type Phase = "splash" | "onboarding" | "done";

const SLIDES = [
  {
    icon: Search,
    title: "Trouvez le bon professionnel",
    text: "Publiez votre projet et recevez des propositions d'entrepreneurs vérifiés RBQ près de chez vous.",
  },
  {
    icon: FileText,
    title: "Contrats & jalons clairs",
    text: "Contrats numériques signés en ligne, paiements par jalons et factures générées automatiquement.",
  },
  {
    icon: ShieldCheck,
    title: "En toute confiance",
    text: "Messagerie sécurisée, avis vérifiés et règlement protégé via la plateforme ou hors plateforme.",
  },
];

const IntroExperience = () => {
  const [phase, setPhase] = useState<Phase>(() => {
    if (typeof window === "undefined") return "done";
    return "splash";
  });
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (phase !== "splash") return;
    const alreadyDone = localStorage.getItem(STORAGE_KEY) === "1";
    const timer = setTimeout(() => {
      setPhase(alreadyDone ? "done" : "onboarding");
    }, SPLASH_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setPhase("done");
  };

  if (phase === "done") return null;

  if (phase === "splash") {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background">
        <div className="animate-in fade-in zoom-in duration-500"><Logo size={56} /></div>
        <div className="mt-6 h-1 w-32 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-[loading_1s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
        <style>{`@keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }`}</style>
      </div>
    );
  }

  const Slide = SLIDES[slide];
  const Icon = Slide.icon;
  const isLast = slide === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-background">
      <div className="flex items-center justify-between p-4">
        <Logo size={32} />
        <Button variant="ghost" size="sm" onClick={finish}>
          Passer
        </Button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10">
          <Icon className="h-12 w-12 text-primary" />
        </div>
        <h2 className="mb-3 max-w-md text-2xl font-bold">{Slide.title}</h2>
        <p className="max-w-md text-muted-foreground">{Slide.text}</p>
      </div>

      <div className="p-6">
        <div className="mb-6 flex items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${i === slide ? "w-6 bg-primary" : "w-2 bg-muted"}`}
            />
          ))}
        </div>
        <div className="mx-auto flex max-w-md gap-3">
          {slide > 0 && (
            <Button variant="outline" className="flex-1" onClick={() => setSlide((s) => s - 1)}>
              Précédent
            </Button>
          )}
          <Button
            className="flex-1 gap-2"
            onClick={() => (isLast ? finish() : setSlide((s) => s + 1))}
          >
            {isLast ? "Commencer" : "Suivant"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IntroExperience;
