export default function Hero() {
  return (
    <section className="bg-[#F9FBFF] py-16 px-6 text-center">

      <h1 className="text-4xl md:text-5xl font-bold text-[#1B2430] mb-4">
        Doma něco čeká?{" "}
        <span className="text-[#FF8C00]">Šikula to zařídí.</span>
      </h1>

      <p className="text-lg text-gray-600 mb-8">
        Vyberte službu, napište pár detailů a šikulové z okolí vám pošlou nabídky.
      </p>

      <div className="flex flex-col md:flex-row justify-center gap-2 mb-6 max-w-2xl mx-auto">
        <input
          type="text"
          placeholder="Např. smontovat skříň, uklidit byt..."
          className="flex-1 p-4 rounded-xl border border-gray-200"
        />
        <button className="bg-[#FF8C00] text-white px-6 py-4 rounded-xl font-semibold">
          Najít šikulu
        </button>
      </div>

      <div className="flex justify-center gap-3 flex-wrap mb-8">
        <button className="bg-red-100 text-red-600 px-4 py-2 rounded-full">
          🔥 Už to hoří (48h)
        </button>
        <button className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full">
          ⚡ Spěchá (14 dní)
        </button>
        <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full">
          🕐 Počkám si
        </button>
      </div>

      <div className="flex justify-center gap-4">
        <button className="bg-[#FF8C00] text-white px-6 py-3 rounded-xl font-semibold">
          Zadat poptávku zdarma
        </button>
        <button className="border border-[#0077B6] text-[#0077B6] px-6 py-3 rounded-xl font-semibold">
          Najít šikulu
        </button>
      </div>

    </section>
  );
}
