"use client";
import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import {
  type Container,
  type ISourceOptions,
  MoveDirection,
  OutMode,
} from "@tsparticles/engine";
// import { loadAll } from "@tsparticles/all"; 
// import { loadFull } from "tsparticles";
import { loadSlim } from "@tsparticles/slim"; 



export default function ParticlesContainer() {
  const [init, setInit] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      //await loadAll(engine);
      //await loadFull(engine);
      await loadSlim(engine);
      //await loadBasic(engine);
    }).then(() => {
      setInit(true);
    });

    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains("dark");
      setIsDark(dark);
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    setIsDark(document.documentElement.classList.contains("dark"));

    return () => observer.disconnect();
  }, []);

  const particlesLoaded = async (container?: Container): Promise<void> => {
    // console.log(container);
  };
  
  // ISourceOptions
  const options: any = useMemo(() => {
    const baseColor = isDark ? "#d1e7dd" : "#2f4f45"; // light gray/blue for light mode

    return {
      fullScreen: { enable: false, },
      background: { color: { value: "transparent" } },
      fpsLimit: 120,
      detectRetina: true,
      interactivity: {
        events: {
          events: {
            onClick: {
              enable: false,
              mode: "push",
            },
            onHover: {
              enable: false,
              mode: "attract",
            },
          },
          modes: {
            push: {
              quantity: 4,
            },
            repulse: {
              distance: 200,
              duration: 0.4,
            },
          },
        },
      },
      particles: {
        color: { value: baseColor },
        links: {
          color: baseColor,
          distance: 180,
          enable: true,
          opacity: 0.15,
          width: 1
        },
        move: {
          enable: true,
          speed: 0.5,
          direction: MoveDirection.topRight,
          outModes: { default: OutMode.out },
        },
        number: {
          value: 140,
          density: { enable: true }
        },
        opacity: { value: 0.2 },
        shape: { type: "circle" },
        size: { value: { min: 1, max: 3 } },
      }
    };
  }, [isDark]);

  if (!init) return null;

  return <Particles id="tsparticles" options={options} />;

};



