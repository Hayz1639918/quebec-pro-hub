/**
 * Full-screen loading indicator shown by route guards while they verify
 * access. Rendering this (instead of `null`) guarantees users never see a
 * blank white screen while an async auth check is in flight.
 */
export default function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground text-sm">Chargement...</p>
      </div>
    </div>
  );
}
