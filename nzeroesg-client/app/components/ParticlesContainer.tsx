

"use client";

import { useCallback } from "react";
import { Engine } from "@tsparticles/engine";

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import {
  type Container,
  type ISourceOptions,
  MoveDirection,
  OutMode,
} from "@tsparticles/engine";
// import { loadAll } from "@tsparticles/all"; // if you are going to use `loadAll`, install the "@tsparticles/all" package too.
// import { loadFull } from "tsparticles"; // if you are going to use `loadFull`, install the "tsparticles" package too.
import { loadSlim } from "@tsparticles/slim"; // if you are going to use `loadSlim`, install the "@tsparticles/slim" package too.
// import { loadBasic } from "@tsparticles/basic"; // if you are going to use `loadBasic`, install the "@tsparticles/basic" package too.





export default function ParticlesContainer() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      // you can initiate the tsParticles instance (engine) here, adding custom shapes or presets
      // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
      // starting from v2 you can add only the features you need reducing the bundle size
      //await loadAll(engine);
      //await loadFull(engine);
      await loadSlim(engine);
      //await loadBasic(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = async (container?: Container): Promise<void> => {
    console.log(container);
  };

  const options: ISourceOptions = useMemo(
    () => ({
      background: { 
        color: {
          // value: "#0f0"  
          value: "transparent" 
        } 
      },
      fpsLimit: 120,
      interactivity: {
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
      particles: {
        color: {
          value: "#f5fcf9",
        },
        links: {
          color: "#f5fcf9",
          distance: 150,
          enable: true,
          opacity: 0.5,
          width: 1,
        },
        move: {
          direction: MoveDirection.none,
          enable: true,
          outModes: {
            default: OutMode.out,
          },
          random: false,
          speed: 0.5,
          straight: false,
        },
        number: {
          density: {
            enable: true,
          },
          value: 80,
        },
        opacity: {
          value: 0.5,
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1, max: 5 },
        },
      },
      detectRetina: true,
    }),
    [],
  );

  if (init) {
    return (
      <Particles
        id="tsparticles"
        particlesLoaded={particlesLoaded}
        options={options}
      />
    );
  }

  return <></>;
};

// "use client";

// import { useCallback } from "react";
// import Particles from "@tsparticles/react";
// import { Engine } from "@tsparticles/engine";
// import { loadSlim } from "@tsparticles/slim"; 

// export default function ParticlesContainer() {
//   const particlesInit = useCallback(async (engine: Engine) => {
//     await loadSlim(engine);
//   }, []);

//   return (
//     <Particles
//       id="tsparticles"
//       className="absolute w-full h-full z-0"
//       init={particlesInit}
//       options={{
//         fullScreen: { enable: false },
//         background: { color: { value: "transparent" } },
//         fpsLimit: 60,
//         interactivity: {
//           events: {
//             onHover: {
//               enable: true,
//               mode: "repulse",
//             },
//             resize: {
//               enable: true
//             }
//           },
//           modes: {
//             repulse: {
//               distance: 100,
//               duration: 0.4,
//             },
//           },
//         },
//         particles: {
//           number: {
//             value: 60,
//             density: {
//               enable: true,
//               width: 800,
//               height: 800,
//             },
//           },
//           color: { value: "#334155" },
//           links: {
//             enable: true,
//             color: "#334155",
//             distance: 150,
//             opacity: 0.4,
//             width: 1,
//           },
//           collisions: { enable: true },
//           move: {
//             enable: true,
//             speed: 1,
//             direction: "none",
//             outModes: { default: "bounce" },
//           },
//           shape: { type: "circle" },
//           opacity: { value: 0.5 },
//           size: { value: { min: 1, max: 4 } },
//         },
//         detectRetina: true,
//       }}
//     />
//   );
// }
