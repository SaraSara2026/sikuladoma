const services = [
  "Montáž nábytku",
  "Vrtání a věšení",
  "Drobné opravy",
  "Úklid",
  "Žehlení",
  "Čištění sedačky",
  "Elektro",
  "Instalatér",
  "Malování",
  "Zahrada"
];

export default function Services() {
  return (
    <section className="py-12 px-6 text-center">
      <h2 className="text-2xl font-bold mb-6">Vyberte službu</h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
        {services.map((service, i) => (
          <button
            key={i}
            className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md"
          >
            {service}
          </button>
        ))}
      </div>
    </section>
  );
}
