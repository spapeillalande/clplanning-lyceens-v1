export const metadata = { title: "CL Planning Lycéens", description: "Planification hebdomadaire (PDF, ICS, rapport)" };
import "./globals.css"; import React from "react";
export default function RootLayout({children}:{children:React.ReactNode}){
  return (<html lang="fr"><body>{children}</body></html>);
}