import { ReactNode } from "react";

type Props = {
  title: string;
  center?: boolean;
  children?: ReactNode;
};

const SpotlightHero = ({ title, center = false, children }: Props) => (
  <section
    className={`hero-dark relative flex w-full flex-col overflow-hidden ${
      center ? "min-h-[100dvh] justify-center" : ""
    }`}
  >
    {/* Background is the global video layer — no per-page washes. */}


    <h1
      className={`hero-title pointer-events-none relative z-20 px-6 mb-2 text-center text-[3rem] leading-[0.95] sm:text-[4rem] ${
        center ? "" : "pt-safe"
      }`}
    >
      {title}
    </h1>

    <div className="relative z-40 flex w-full flex-col">{children}</div>
  </section>
);

export default SpotlightHero;
