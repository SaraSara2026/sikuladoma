// Tarify pro šikuly. Používáno v Pricing, RegForm i Sikula dashboardu.

export const PLANS = [
  { id: "start", name: "Start", price: "Zdarma", period: "",
    perks: ["3 reakce měsíčně", "Základní profil", "Recenze zákazníků"],
    featured: false },
  { id: "plus",  name: "Plus",  price: "299 Kč", period: "/měs",
    perks: ["20 reakcí měsíčně", "Lepší pozice ve výsledcích", "Statistiky profilu", "Fakturační modul"],
    featured: false },
  { id: "profi", name: "Profi", price: "599 Kč", originalPrice: "799 Kč", period: "/měs",
    perks: ["80 reakcí měsíčně", "Přednostní zobrazení", "Ověřený odznak", "Plný fakturační modul", "Urgentní notifikace"],
    featured: true },
  { id: "top",   name: "Top Šikula", price: "1 299 Kč", period: "/měs",
    perks: ["Neomezené reakce", "Top pozice vždy", "Dedikovaný support", "Vše z Profi tarifu", "Brandovaný profil"],
    featured: false },
];
