import { useState } from "react";

export default function AboutSection() {
  const [activeTab, setActiveTab] = useState("main");
  const mainCommittee = [
    { name: "શ્રી  મનસુખભાઈ  કે. ધોળકિયા ", role: "પ્રમુખ ", village: "ઉંટવડ" },//phone: "999999999" },
    { name: "શ્રી  મનસુખભાઈ વી. ધોળકિયા ", role: "ઉપ પ્રમુખ ", village: "તાજપર " },// phone: "999999999" },
    { name: "શ્રી  કાંતિભાઈ જે. ધોળકિયા ", role: "મંત્રી", village: "તરઘરા" },// phone: "999999999" },
    { name: "શ્રી  પ્રવીણભાઈ વી. ધોળકિયા ", role: "ખજાનચી ", village: "ઘૂઘરાળા" },// phone: "999999999" },
    { name: "શ્રી  હિંમતભાઈ આર. ધોળકિયા ", role: "કો-ઓર્ડીનેટર ", village: "ખાંભડા" },// phone: "999999999" },
  ];

  const members = [
    { name: "શ્રી  કાંતિભાઈ કે. ધોળકિયા ", village: "દૂધાળા ", phone: "" },
    { name: "શ્રી  કાળુભાઈ કે. ધોળકિયા ", village: "બાબરા", phone: "" },
    { name: "શ્રી  ઝવેરભાઈ એમ. ધોળકિયા", village: "બાબરા ", phone: "" },
    { name: "શ્રી  શંભુભાઈ બી. ધોળકિયા ", village: "લાઠી ", phone: "" },
    { name: "શ્રી  ઘનશ્યામભાઈ એસ. ધોળકિયા ", village: "લાઠી ", phone: "" },
    { name: "શ્રી  રામજીભાઈ એલ. ધોળકિયા ", village: "રણછોડપૂર ", phone: "" },
    { name: "શ્રી  નરેશભાઈ એલ. ધોળકિયા ", village: "રણછોડપૂર ", phone: "" },
    { name: "શ્રી  નટુભાઈ ડી. ધોળકિયા ", village: "ચમારડી ", phone: "" },
    { name: "શ્રી  વિષ્ણુભાઈ એસ. ધોળકિયા ", village: "લીમડા ", phone: "" },
    { name: "શ્રી  મહેશભાઈ જે. ધોળકિયા ", village: "લીમડા ", phone: "" },
    { name: "શ્રી  મનહરભાઈ બી. ધોળકિયા ", village: "ખાખરીયા ", phone: "" },
    { name: "શ્રી  ભરતભાઈ જે. ધોળકિયા ", village: "ઉંટવડ ", phone: "" },
    { name: "શ્રી  કારમશીભાઈ ઝેડ. ધોળકિયા ", village: "તાજપર ", phone: "" },
    { name: "શ્રી  વિજયભાઈ સી. ધોળકિયા ", village: "માંડવી ", phone: "" },
    { name: "શ્રી  રમેશભાઈ કે. ધોળકિયા ", village: "રામપર ", phone: "" },
    { name: "શ્રી  ભરતભાઈ એમ. ધોળકિયા ", village: "દામનગર ", phone: "" },
    { name: "શ્રી  તુલસીભાઈ બી. ધોળકિયા ", village: "પ્રતાપગઢ ", phone: "" },
    { name: "શ્રી  કિરીટભાઈ આર. ધોળકિયા ", village: "ઠાંસા", phone: "" },
    { name: "શ્રી  રાજુભાઈ વી. ધોળકિયા ", village: "ખીજડીયા ", phone: "" },
    { name: "શ્રી  હર્ષિલભાઈ વી. ધોળકિયા ", village: "રાજુલા", phone: "" },
    { name: "શ્રી  નીતિનભાઈ પી. ધોળકિયા ", village: "ઉમરડા", phone: "" },
  ];

  return (
    <section
      id="about-content"
      className="relative w-full py-12 bg-[#fff6e5] reveal overflow-hidden"
    >

      {/* ===== HEADING ===== */}
      <div className="relative max-w-7xl mx-auto px-6 mb-10">
        <h2 className="text-4xl md:text-5xl font-serif text-[#7a1f1f] tracking-tight">
          About <span className="italic text-yellow-600">Us</span>
        </h2>
        <div className="h-1 w-24 bg-gradient-to-r from-[#7a1f1f] to-yellow-500 mt-2 rounded-full" />
        <p className="mt-4 text-[#7a1f1f]/80 max-w-3xl">
          Dholakiya Parivar ni sangathan atli majboot chhe ke amara saath
          bandhan, seva ane sanskar sada ek j rite vikas pame chhe.
        </p>
      </div>

      {/* ===== MAIN COMMITTEE ===== */}
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="flex md:hidden items-center gap-3 mb-6">
          {[
            { id: "main", label: "Main Committee" },
            { id: "other", label: "Other Committee" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={
                  `px-4 py-1.5 rounded-full border text-sm ` +
                  `transition-all duration-300 ` +
                  (isActive
                    ? "bg-[#7a1f1f] text-white border-[#7a1f1f] shadow-md"
                    : "bg-white text-[#7a1f1f] border-[#7a1f1f]/30 hover:bg-[#7a1f1f] hover:text-white hover:shadow-lg")
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className={`${activeTab !== "main" ? "hidden md:block" : ""}`}>
          <h3 className="text-xl md:text-2xl font-semibold text-[#7a1f1f] mb-6">
            Main Committee
          </h3>
          <div className="w-20 h-[3px] bg-yellow-400/80 -mt-4 mb-6 rounded-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {mainCommittee.map((member) => (
              <div
                // key={member.name}
                className="group bg-white/95 rounded-3xl border border-[#7a1f1f]/20 shadow-lg p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-yellow-400"
              >
                <div className="text-lg font-semibold text-[#7a1f1f]">
                  {member.name}
                </div>
                <div className="mt-2 text-sm font-medium text-[#7a1f1f]/70">
                  {member.role}
                </div>
                {member.village ? (
                  <div className="mt-2 text-sm md:text-base font-medium text-[#7a1f1f]/80">
                    ગામ: {member.village}
                  </div>
                ) : null}
                {member.phone ? (
                  <div className="mt-1 text-sm font-semibold text-[#7a1f1f]/70 tracking-wide">
                    {member.phone}
                  </div>
                ) : null}
                <div className="mt-4 h-[2px] w-12 mx-auto bg-yellow-400/80 rounded-full transition-all duration-300 group-hover:w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== OTHER MEMBERS ===== */}
      <div className={`relative max-w-7xl mx-auto px-6 mt-12 ${activeTab !== "other" ? "hidden md:block" : ""}`}>
        <h3 className="text-xl md:text-2xl font-semibold text-[#7a1f1f] mb-6">
          Committee Members
        </h3>
        <div className="w-24 h-[3px] bg-yellow-400/80 -mt-4 mb-6 rounded-full" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {members.map((member) => (
            <div
              key={member.name}
              className="bg-white/95 rounded-2xl border border-[#7a1f1f]/15 shadow-sm p-4 text-center text-sm font-medium text-[#7a1f1f] transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 hover:border-yellow-400"
            >
              <div>{member.name}</div>
              {member.village ? (
                <div className="mt-1 text-xs md:text-sm font-medium text-[#7a1f1f]/70">
                  ગામ: ({member.village})
                </div>
              ) : null}
              {/* {member.phone ? (
                <div className="mt-1 text-sm font-semibold text-[#7a1f1f]/70 tracking-wide">
                  {member.phone}
                </div>
              ) : null}  */}
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-black/5 pointer-events-none" />

    </section>
  );
}
