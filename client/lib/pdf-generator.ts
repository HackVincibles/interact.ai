"use client";

import { jsPDF } from "jspdf";

interface InterviewReportData {
  type: "interview";
  userName: string;
  role: string;
  totalScore: number;
  finalAssessment: string;
  strengths: string[];
  areasForImprovement: string[];
  categoryScores: { name: string; score: number; comment: string }[];
  transcript?: { role: string; content: string }[];
}

interface GDReportData {
  type: "gd";
  userName: string;
  topic: string;
  participants: string[];
  duration: number;
  aiAnalysis: string;
  communicationScore: number;
  leadershipScore: number;
  teamworkScore: number;
  knowledgeScore: number;
  strengths: string[];
  areasForImprovement: string[];
}

export type ReportData = InterviewReportData | GDReportData;

export const generatePDFReport = async (data: ReportData) => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = 20;

  // Header
  doc.setFillColor(0, 102, 255);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INTERACT AI", margin, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    data.type === "interview" ? "Interview Performance Report" : "Group Discussion Report",
    margin,
    32
  );

  doc.text(new Date().toLocaleDateString(), pageWidth - margin - 20, 20);

  cursorY = 55;

  // Candidate Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`Candidate: ${data.userName}`, margin, cursorY);
  cursorY += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  if (data.type === "interview") {
    doc.text(`Role: ${data.role} Interview`, margin, cursorY);
  } else {
    doc.text(`Topic: ${data.topic}`, margin, cursorY);
    cursorY += 6;
    doc.text(`Duration: ${data.duration} minutes`, margin, cursorY);
    cursorY += 6;
    doc.text(`Participants: ${data.participants.join(", ")}`, margin, cursorY);
  }
  cursorY += 20;

  // Overall Score
  const totalScore =
    data.type === "interview"
      ? data.totalScore
      : Math.round(
          (data.communicationScore + data.leadershipScore + data.teamworkScore + data.knowledgeScore) / 4
        );

  doc.setDrawColor(0, 102, 255);
  doc.setLineWidth(1);
  doc.circle(margin + 15, cursorY + 15, 15);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`${totalScore}`, margin + 11, cursorY + 16);

  doc.setFontSize(12);
  doc.text(
    data.type === "interview" ? "Overall Readiness Score" : "Overall Performance Score",
    margin + 40,
    cursorY + 16
  );
  cursorY += 40;

  // Expert Insights / AI Analysis
  doc.setFontSize(14);
  doc.text(data.type === "interview" ? "Expert Insights:" : "AI Moderator Analysis:", margin, cursorY);
  cursorY += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  const analysis =
    data.type === "interview" ? data.finalAssessment : data.aiAnalysis;
  const splitAssessment = doc.splitTextToSize(analysis, pageWidth - margin * 2);
  doc.text(splitAssessment, margin, cursorY);
  cursorY += splitAssessment.length * 5 + 15;

  // Strengths
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(34, 197, 94);
  doc.text("Key Strengths:", margin, cursorY);
  cursorY += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  data.strengths.slice(0, 5).forEach((s) => {
    doc.text(`• ${s}`, margin + 5, cursorY);
    cursorY += 6;
  });
  cursorY += 10;

  // Improvements
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(249, 115, 22);
  doc.text("Areas for Growth:", margin, cursorY);
  cursorY += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  data.areasForImprovement.slice(0, 5).forEach((item) => {
    doc.text(`• ${item}`, margin + 5, cursorY);
    cursorY += 6;
  });

  // Category Scores
  cursorY += 15;
  doc.setFont("helvetica", "bold");
  doc.text(
    data.type === "interview" ? "Skill Breakdown:" : "Performance Categories:",
    margin,
    cursorY
  );
  cursorY += 8;

  doc.setFont("helvetica", "normal");

  const categories =
    data.type === "interview"
      ? data.categoryScores
      : [
          { name: "Communication Skills", score: data.communicationScore },
          { name: "Leadership", score: data.leadershipScore },
          { name: "Teamwork", score: data.teamworkScore },
          { name: "Knowledge & Logic", score: data.knowledgeScore },
        ];

  categories.forEach((cat) => {
    if (cursorY > 270) {
      doc.addPage();
      cursorY = 20;
    }
    doc.text(`${cat.name}:`, margin + 5, cursorY);
    doc.text(`${cat.score}/100`, pageWidth - margin - 20, cursorY);

    // Progress bar
    doc.setDrawColor(200, 200, 200);
    doc.line(margin + 5, cursorY + 2, pageWidth - margin, cursorY + 2);
    doc.setDrawColor(0, 102, 255);
    doc.setLineWidth(2);
    const barPadding = 25;
    const barLength = (pageWidth - margin * 2 - barPadding) * (cat.score / 100);
    doc.line(margin + 5, cursorY + 2, margin + 5 + barLength, cursorY + 2);

    cursorY += 12;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "Generated by InteractAI - Team Invincibles",
    pageWidth / 2,
    285,
    { align: "center" }
  );

  // Save PDF
  const fileName =
    data.type === "interview"
      ? `${data.userName}_Interview_Report.pdf`
      : `${data.userName}_GD_Report.pdf`;

  doc.save(fileName);
};
