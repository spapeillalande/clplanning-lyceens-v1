"use client";
import React, { useState } from "react";
import html2pdf from "html2pdf.js";

export default function PlanningHebdoVisuel() {
  const [week, setWeek] = useState("A");
  const [duplicate, setDuplicate] = useState(true);
  const [eleve, setEleve] = useState("");
  const [formateur, setFormateur] = useState("");
  const [etablissement, setEtablissement] = useState("");
  const [reference, setReference] = useState("05/10/2025");

  // Simulation de données
  const totalHours = 32;
  const totalCourses = 20;
  const totalCommutes = 4;
  const totalFree = 8;

  const exportPDF = () => {
    const element = document.getElementById("planning-export");
    const opt = {
      margin: 0.5,
      filename: `${eleve || "planning"}_${week}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "landscape" },
    };
    html2pdf().set(opt).from(element).save();
  };

  const exportICS = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Planning Hebdo//FR
BEGIN:VEVENT
SUMMARY:Planning hebdomadaire ${eleve}
DTSTART;TZID=Europe/Paris:20251005T080000
DTEND;TZID=Europe/Paris:20251005T180000
DESCRIPTION:Exemple d'emploi du temps généré automatiquement
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${eleve || "planning"}_${week}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importICS = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      alert("Fichier .ics importé avec succès !");
      console.log(content);
    };
    reader.readAsText(file);
  };

  const Rapport2Semaines = () => {
    const total2semaines = totalHours * 2;
    return (
      <div className="p-6 bg-blue-50 rounded-lg shadow border border-blue-200 mt-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-2">
          Rapport des 2 semaines
        </h2>
        <p className="text-gray-700 text-sm">
          Élève : <strong>{eleve || "non renseigné"}</strong> <br />
          Formateur : <strong>{formateur || "non renseigné"}</strong> <br />
          Établissement : <strong>{etablissement || "non renseigné"}</strong> <br />
          Lundi de référence : <strong>{reference}</strong>
        </p>
        <ul className="mt-4 text-sm text-gray-700 space-y-1">
          <li>🕒 Total heures sur 2 semaines : {total2semaines} h</li>
          <li>📚 Cours : {totalCourses * 2} h</li>
          <li>🚗 Déplacements : {totalCommutes * 2} h</li>
          <li>🏠 Temps libre : {totalFree * 2} h</li>
        </ul>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6" id="planning-export">
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-800">
          Planning hebdomadaire visuel
        </h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => window.print()}
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-md text-sm font-semibold shadow-sm"
          >
            🖨️ Imprimer
          </button>
          <button
            onClick={exportPDF}
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-md text-sm font-semibold shadow-sm"
          >
            📄 PDF
          </button>
          <button
            onClick={exportICS}
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-md text-sm font-semibold shadow-sm"
          >
            📅 .ICS A+B
          </button>
          <label className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-md text-sm font-semibold shadow-sm">
            📂 Import .ICS
            <input
              type="file"
              accept=".ics"
              onChange={importICS}
              className="hidden"
            />
          </label>
          <button
            onClick={() => alert("Rapport généré avec succès ✅")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold shadow"
          >
            📊 Rapport 2 semaines
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-1">
            Élève
          </label>
          <input
            type="text"
            value={eleve}
            onChange={(e) => setEleve(e.target.value)}
            className="w-full border border-blue-200 rounded-md px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-1">
            Formateur / Accompagnant
          </label>
          <input
            type="text"
            value={formateur}
            onChange={(e) => setFormateur(e.target.value)}
            className="w-full border border-blue-200 rounded-md px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-1">
            Établissement
          </label>
          <input
            type="text"
            value={etablissement}
            onChange={(e) => setEtablissement(e.target.value)}
            className="w-full border border-blue-200 rounded-md px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-1">
            Lundi de référence
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full border border-blue-200 rounded-md px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div className="mt-6 mb-4 p-4 bg-blue-50 rounded-lg shadow-sm border border-blue-200">
        <h2 className="text-xl font-semibold text-blue-700 mb-3">
          Totaux semaine {week}
        </h2>
        <ul className="text-gray-700 space-y-1 text-sm">
          <li>🕒 Heures totales : {totalHours} h</li>
          <li>📚 Cours : {totalCourses} h</li>
          <li>🚗 Déplacements : {totalCommutes} h</li>
          <li>🏠 Temps libre : {totalFree} h</li>
        </ul>
      </div>

      <Rapport2Semaines />
    </div>
  );
}
