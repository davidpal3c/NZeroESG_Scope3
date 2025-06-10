
export const metadata = {
  title: "User Portal",
  description: "User Portal for NZeroes ESG",       
};

import { ReactNode } from "react";
import ParticlesContainer from "@/app/components/ParticlesContainer";   

export default function UserPortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="">
      <div className="relative h-screen">
        <ParticlesContainer />
        <div className="absolute inset-0 flex items-center justify-center z-10">
          {children}
        </div>
      </div>
    </div>
  );
//   return (
//     <main className="min-h-screen bg-background text-primary">
//       {/* You can add a sidebar or portal nav here if needed */}
//       {children}
//     </main>
//   );
}
