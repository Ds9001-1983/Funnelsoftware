import type { PageElement } from "@shared/schema";

/**
 * Erstellt ein neues PageElement mit passenden Standard-Werten für den gegebenen Typ.
 * Konsolidiert die Element-Erstellung für alle Stellen im Editor.
 */
export function createNewElement(type: PageElement["type"]): PageElement {
  const id = `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  return {
    id,
    type,
    // Form placeholders
    placeholder:
      type === "input" ? "Dein Text hier..." :
      type === "textarea" ? "Deine Nachricht..." :
      type === "select" ? "Option wählen..." :
      type === "date" ? "Datum auswählen..." : undefined,
    options:
      type === "radio" ? ["Option 1", "Option 2", "Option 3"] :
      type === "select" ? ["Option 1", "Option 2", "Option 3"] : undefined,
    // Labels
    label:
      type === "fileUpload" ? "Datei hochladen" :
      type === "video" ? "Video" :
      type === "audio" ? "Audio" :
      type === "date" ? "Datum" :
      type === "heading" ? "Überschrift" :
      type === "text" ? "Dein Text hier..." :
      type === "select" ? "Auswahl" :
      type === "button" ? "Klicken" :
      type === "calendar" ? "Termin buchen" :
      type === "image" ? "Bild" :
      type === "quiz" ? "Quiz" : undefined,
    // Content
    content:
      type === "heading" ? "Deine Überschrift" :
      type === "text" ? "Füge hier deinen Text ein. Beschreibe dein Angebot oder gib wichtige Informationen." :
      type === "button" ? "Jetzt starten" : undefined,
    // Image
    imageUrl: type === "image" ? "" : undefined,
    imageAlt: type === "image" ? "" : undefined,
    // File upload
    acceptedFileTypes: type === "fileUpload" ? [".pdf", ".jpg", ".jpeg", ".png"] : undefined,
    maxFileSize: type === "fileUpload" ? 10 : undefined,
    maxFiles: type === "fileUpload" ? 1 : undefined,
    // Video
    videoUrl: type === "video" ? "" : undefined,
    videoType: type === "video" ? "youtube" : undefined,
    videoAutoplay: type === "video" ? false : undefined,
    // Audio
    audioUrl: type === "audio" ? "" : undefined,
    audioAutoplay: type === "audio" ? false : undefined,
    audioLoop: type === "audio" ? false : undefined,
    // Date
    includeTime: type === "date" ? false : undefined,
    // Calendar/Booking
    calendarProvider: type === "calendar" ? "calendly" : undefined,
    calendarUrl: type === "calendar" ? "" : undefined,
    // Slides (testimonial/slider)
    slides: type === "testimonial" ? [
      { id: "t1", text: "Großartiger Service! Sehr empfehlenswert.", author: "Max Mustermann", role: "Geschäftsführer", rating: 5 }
    ] : type === "slider" ? [
      { id: "s1", title: "Slide 1", text: "" },
      { id: "s2", title: "Slide 2", text: "" },
      { id: "s3", title: "Slide 3", text: "" }
    ] : undefined,
    // FAQ
    faqItems: type === "faq" ? [
      { id: "faq1", question: "Wie funktioniert das?", answer: "So funktioniert es..." },
      { id: "faq2", question: "Was kostet das?", answer: "Die Preise sind..." },
    ] : undefined,
    // List
    listItems: type === "list" ? [
      { id: "li1", text: "Vorteil Nummer 1" },
      { id: "li2", text: "Vorteil Nummer 2" },
      { id: "li3", text: "Vorteil Nummer 3" },
    ] : undefined,
    listStyle: type === "list" ? "check" : undefined,
    // Layout
    spacerHeight: type === "spacer" ? 32 : undefined,
    dividerStyle: type === "divider" ? "solid" : undefined,
    // Timer/Countdown
    timerEndDate: (type === "timer" || type === "countdown") ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    timerStyle: type === "timer" ? "countdown" : undefined,
    timerShowDays: (type === "timer" || type === "countdown") ? true : undefined,
    countdownDate: type === "countdown" ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    countdownStyle: type === "countdown" ? "flip" : undefined,
    countdownShowLabels: type === "countdown" ? true : undefined,
    // Social Proof
    socialProofType: type === "socialProof" ? "logos" : undefined,
    socialProofItems: type === "socialProof" ? [
      { id: "sp1", image: "", text: "", value: "" },
      { id: "sp2", image: "", text: "", value: "" },
      { id: "sp3", image: "", text: "", value: "" },
    ] : undefined,
    // Progress Bar
    progressValue: type === "progressBar" ? 60 : undefined,
    progressShowLabel: type === "progressBar" ? true : undefined,
    // Icon
    iconName: type === "icon" ? "star" : undefined,
    iconSize: type === "icon" ? "md" : undefined,
    // Map
    mapAddress: type === "map" ? "Berlin, Germany" : undefined,
    mapZoom: type === "map" ? 14 : undefined,
    mapStyle: type === "map" ? "roadmap" : undefined,
    // Chart
    chartType: type === "chart" ? "bar" : undefined,
    chartData: type === "chart" ? {
      labels: ["Jan", "Feb", "Mär", "Apr"],
      datasets: [{ label: "Daten", data: [10, 20, 30, 40], color: "#7C3AED" }]
    } : undefined,
    // Code/Embed
    codeContent: type === "code" ? "// Dein Code hier\nconsole.log('Hello!');" : undefined,
    codeLanguage: type === "code" ? "javascript" : undefined,
    embedCode: type === "embed" ? "" : undefined,
    embedUrl: type === "embed" ? "" : undefined,
    // Product
    productName: type === "product" ? "Premium Produkt" : undefined,
    productPrice: type === "product" ? "99,00 €" : undefined,
    productDescription: type === "product" ? "Beschreibung deines Produkts..." : undefined,
    productButtonText: type === "product" ? "Jetzt kaufen" : undefined,
    // Team
    teamMembers: type === "team" ? [
      { id: "tm1", name: "Max Mustermann", role: "CEO", image: "", bio: "Gründer und Visionär" },
      { id: "tm2", name: "Erika Musterfrau", role: "CTO", image: "", bio: "Technische Leitung" },
    ] : undefined,
    // Quiz
    quizConfig: type === "quiz" ? {
      questions: [
        {
          id: "q1",
          question: "Beispiel-Frage: Was trifft am besten auf dich zu?",
          answers: [
            { id: "a1", text: "Antwort A", points: { r1: 3, r2: 1 } },
            { id: "a2", text: "Antwort B", points: { r1: 1, r2: 3 } },
          ],
        },
      ],
      results: [
        { id: "r1", title: "Ergebnis A", description: "Du passt am besten zu Ergebnis A.", minPoints: 0, maxPoints: 3, color: "#7C3AED" },
        { id: "r2", title: "Ergebnis B", description: "Du passt am besten zu Ergebnis B.", minPoints: 0, maxPoints: 3, color: "#2563EB" },
      ],
      showProgressBar: true,
      shuffleQuestions: false,
      shuffleAnswers: false,
    } : undefined,
    // Button
    buttonUrl: type === "button" ? "" : undefined,
    buttonTarget: type === "button" ? "_self" : undefined,
    buttonVariant: type === "button" ? "primary" : undefined,
  };
}
