import Image from "next/image";

type RouteLoadingScreenProps = {
  label?: string;
};

export function RouteLoadingScreen({
  label = "Loading",
}: RouteLoadingScreenProps) {
  return (
    <div className="route-loader-shell" aria-live="polite" aria-busy="true">
      <div className="route-loader-backdrop" />
      <div className="route-loader-orbital">
        <span className="route-loader-halo" />
        <span className="route-loader-dot-ring route-loader-dot-ring-one" />
        <span className="route-loader-dot-ring route-loader-dot-ring-two" />
        <span className="route-loader-core">
          <Image
            src="/kkko.png"
            alt="BEE logo"
            fill
            sizes="72px"
            className="object-contain"
            priority
          />
        </span>
      </div>
      <div className="route-loader-copy">
        <p className="route-loader-kicker">BEE</p>
        <p className="route-loader-label">{label}</p>
      </div>
    </div>
  );
}
