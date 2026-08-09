import { User, FileText, Star } from "lucide-react";

const stats = [
  {
    icon: User,
    value: "2 500+",
    label: "professionnels vérifiés",
  },
  {
    icon: FileText,
    value: "15 000+",
    label: "projets publiés",
  },
  {
    icon: Star,
    value: "4,8/5",
    label: "satisfaction moyenne",
  },
];

const HomeStats = () => {
  return (
    <section className="bg-white pt-16 sm:pt-20 pb-10 sm:pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-0">
          {stats.map(({ icon: Icon, value, label }, index) => (
            <div
              key={label}
              className={`flex items-center justify-center gap-4 sm:gap-5 px-4 ${
                index > 0 ? "sm:border-l sm:border-slate-200" : ""
              }`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <div className="font-ui text-2xl sm:text-3xl font-bold text-primary leading-none tracking-tight">
                  {value}
                </div>
                <div className="font-ui text-sm text-slate-500 mt-1.5">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeStats;
