export default function Pricing() {
  return (
    <section className="py-16 px-6 bg-[#F9FBFF]">
      <h2 className="text-3xl font-bold text-center mb-10">
        Vyberte si tarif
      </h2>

      <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">

        <div className="bg-white p-6 rounded-xl border">
          <h3 className="font-semibold mb-2">Start</h3>
          <p className="text-3xl font-bold mb-4">Zdarma</p>
          <p>3 reakce měsíčně</p>
        </div>

        <div className="bg-white p-6 rounded-xl border">
          <h3 className="font-semibold mb-2">Plus</h3>
          <p className="text-3xl font-bold mb-4">299 Kč</p>
          <p>20 reakcí měsíčně</p>
        </div>

        <div className="bg-white p-6 rounded-xl border-2 border-[#FF8C00]">
          <span className="bg-[#FF8C00] text-white px-3 py-1 rounded-full text-sm">
            Nejoblíbenější
          </span>
          <h3 className="font-semibold mt-2 mb-2">Profi</h3>
          <p className="text-3xl font-bold mb-4">599 Kč</p>
          <p>80 reakcí měsíčně</p>
        </div>

        <div className="bg-white p-6 rounded-xl border">
          <h3 className="font-semibold mb-2">Top Šikula</h3>
          <p className="text-3xl font-bold mb-4">999 Kč</p>
          <p>Neomezené reakce</p>
        </div>

      </div>
    </section>
  );
}
