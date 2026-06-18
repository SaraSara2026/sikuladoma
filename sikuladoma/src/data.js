export const CATEGORIES = [
  { id: 'opravy', name: 'Drobné opravy', icon: '🔧' },
  { id: 'montaz', name: 'Montáž nábytku', icon: '🪑' },
  { id: 'vrtani', name: 'Vrtání a věšení', icon: '🪛' },
  { id: 'instalater', name: 'Instalatér', icon: '🚿' },
  { id: 'elektro', name: 'Elektro', icon: '⚡' },
  { id: 'malovani', name: 'Malování', icon: '🖌️' },
  { id: 'uklid', name: 'Úklid', icon: '🧹' },
  { id: 'zehleni', name: 'Žehlení', icon: '👕' },
  { id: 'cisteni', name: 'Čištění sedaček', icon: '🛋️' },
  { id: 'zahrada', name: 'Zahrada', icon: '🌿' },
  { id: 'stehovani', name: 'Stěhování drobností', icon: '📦' },
  { id: 'hodinovy', name: 'Hodinový šikula', icon: '⏱️' },
  { id: 'jine', name: 'Jiné', icon: '💡' },
];

export const USERS = {
  customer: { id: 1, name: 'Jana Nováková', email: 'jana@example.com', role: 'customer', avatar: 'JN', city: 'Praha 6' },
  sikula: { id: 2, name: 'Pavel Šikovný', email: 'pavel@example.com', role: 'sikula', avatar: 'PŠ', city: 'Praha', rating: 4.9, jobs: 87, plan: 'Šikula Profi', verified: true, services: ['Drobné opravy', 'Montáž nábytku', 'Vrtání a věšení'], price: '350 Kč/hod' },
  admin: { id: 3, name: 'Admin', email: 'admin@sikuladoma.cz', role: 'admin', avatar: 'AD' },
};

export const DEMO_ORDERS = [
  { id: 1, title: 'Montáž IKEA skříně', category: 'Montáž nábytku', icon: '🪑', status: 'offers', city: 'Praha 6', budget: '800–1200 Kč', created: '2 hod zpět', urgent: false, customer: 'Jana N.', offers: 3, desc: 'Potřebuji smontovat skříň PAX 200x60 cm, 3 ks. Vše mám doma, jen nemám čas ani šikovné ruce.', access: '2. patro, výtah', parking: 'Placené parkování v ulici' },
  { id: 2, title: 'Oprava kapajícího kohoutku', category: 'Instalatér', icon: '🚿', status: 'new', city: 'Praha 2', budget: '500–800 Kč', created: '5 hod zpět', urgent: true, customer: 'Martin K.', offers: 0, desc: 'Kape kohoutek v kuchyni. Zkusil jsem vyměnit těsnění ale pořád kape.', access: 'přízemí', parking: 'Zdarma před domem' },
  { id: 3, title: 'Vyčistit sedačku 3+2', category: 'Čištění sedaček', icon: '🛋️', status: 'confirmed', city: 'Praha 4', budget: '1500–2000 Kč', created: 'včera', urgent: false, customer: 'Petra M.', offers: 5, desc: 'Sedačka od psa, potřebuje hluboké čištění. Látka, světlá.', access: '5. patro, výtah', parking: 'Parkoviště u domu' },
  { id: 4, title: 'Pověsit 5 obrazů', category: 'Vrtání a věšení', icon: '🪛', status: 'completed', city: 'Praha 3', budget: '400 Kč', created: '3 dny zpět', urgent: false, customer: 'Jana N.', offers: 4, desc: 'Různé velikosti, zdi z cihly.', access: 'přízemí', parking: 'Zdarma' },
  { id: 5, title: 'Úklid po rekonstrukci', category: 'Úklid', icon: '🧹', status: 'in_progress', city: 'Praha 8', budget: '2000–3000 Kč', created: '1 den zpět', urgent: false, customer: 'Tomáš B.', offers: 2, desc: 'Byt 3+kk po rekonstrukci, stavební prach, cca 80m2.', access: '3. patro, bez výtahu', parking: 'Ulice zdarma' },
];

export const DEMO_OFFERS = [
  { id: 1, orderId: 1, sikula: 'Pavel Šikovný', avatar: 'PŠ', price: 900, time: '1,5 hod', date: 'Zítra od 10:00', message: 'Dobrý den, montáž IKEA PAX mám v malíku, udělám vám to za 900 Kč včetně přepravy šroubků. Mám vlastní nářadí.', rating: 4.9, jobs: 87, verified: true, plan: 'Profi' },
  { id: 2, orderId: 1, sikula: 'Radek Tesař', avatar: 'RT', price: 1100, time: '2 hod', date: 'Pozítří od 14:00', message: 'Zdravím, dám vám záruční montáž + zkontroluji veškeré šrouby. Cena 1100 Kč.', rating: 4.7, jobs: 34, verified: true, plan: 'Plus' },
  { id: 3, orderId: 1, sikula: 'Jiří Novák', avatar: 'JN', price: 800, time: '2 hod', date: 'Tento týden', message: 'Nabídnu nejlevnější cenu 800 Kč.', rating: 4.2, jobs: 12, verified: false, plan: 'Start' },
];

export const DEMO_MESSAGES = {
  1: [
    { from: 'them', text: 'Dobrý den, ještě máte zájem o montáž? Mohl bych přijít zítra v 10:00.', time: '10:32' },
    { from: 'me', text: 'Dobrý den, ano, zítra by bylo skvělé!', time: '10:45' },
    { from: 'them', text: 'Perfektní. Vezmu sebou všechno nářadí. Budete doma celé dopoledne?', time: '10:46' },
    { from: 'me', text: 'Ano, budu doma od 9:00 do 13:00.', time: '10:50' },
    { from: 'them', text: 'Výborně, tak se uvidíme v 10:00. Zvoňte Pavel Šikovný. 👍', time: '10:51' },
  ],
};

export const DEMO_INVOICES = [
  { id: 'FAK-2024-001', orderId: 4, title: 'Pověšení 5 obrazů', customer: 'Jana Nováková', amount: 400, status: 'paid', created: '15.3.2024', due: '22.3.2024', ico: '12345678' },
  { id: 'FAK-2024-002', orderId: 3, title: 'Čištění sedačky', customer: 'Petra Malá', amount: 1800, status: 'sent', created: '20.3.2024', due: '27.3.2024', ico: '12345678' },
  { id: 'FAK-2024-003', orderId: 5, title: 'Úklid po rekonstrukci', customer: 'Tomáš Beneš', amount: 2400, status: 'draft', created: '25.3.2024', due: '1.4.2024', ico: '12345678' },
];

export const REVIEWS = [
  { name: 'Jana Nováková', initials: 'JN', text: 'Pavel přišel přesně, skříň smontoval za hodinu. Naprosto spokojená! Určitě využiju znovu.', service: 'Montáž nábytku', stars: 5 },
  { name: 'Martin Král', initials: 'MK', text: 'Konečně portál, který dává smysl. Zadal jsem poptávku, za 2 hodiny jsem měl 4 nabídky. Skvělé!', service: 'Drobné opravy', stars: 5 },
  { name: 'Petra Malá', initials: 'PM', text: 'Šikula přijel, sedačka vypadá jako nová. Cena odpovídá kvalitě. Doporučuji.', service: 'Čištění sedaček', stars: 4 },
  { name: 'Tomáš Beneš', initials: 'TB', text: 'Rychlá reakce, profesionální přístup. Byt po rekonstrukci byl zametený do poslední rohle.', service: 'Úklid', stars: 5 },
  { name: 'Eva Procházková', initials: 'EP', text: 'Oceňuji jednoduchost aplikace. Jako starší člověk jsem to zvládla bez problémů.', service: 'Žehlení', stars: 5 },
  { name: 'Lukáš Dvořák', initials: 'LD', text: 'Jako šikula jsem získal za první měsíc 8 zakázek. Investice do Profi tarifu se vyplatila.', service: 'Elektro', stars: 5 },
];

export const ORDER_STATUS_MAP = {
  new: { label: 'Nová', color: 'badge-blue' },
  offers: { label: 'Nabídky', color: 'badge-orange' },
  confirmed: { label: 'Potvrzeno', color: 'badge-green' },
  in_progress: { label: 'Probíhá', color: 'badge-yellow' },
  completed: { label: 'Dokončeno', color: 'badge-gray' },
  paid: { label: 'Zaplaceno', color: 'badge-green' },
};

export const INVOICE_STATUS_MAP = {
  draft: { label: 'Návrh', color: 'badge-gray' },
  sent: { label: 'Vystaveno', color: 'badge-blue' },
  paid: { label: 'Zaplaceno', color: 'badge-green' },
  overdue: { label: 'Po splatnosti', color: 'badge-red' },
};
