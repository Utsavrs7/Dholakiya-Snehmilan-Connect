import { useEffect, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export default function IntroSection() {
  const fullText =
    "ધોળકિયા પરિવાર – પરંપરા, સંસ્કાર અને એકતાનું પ્રતિક છે. ધોળકિયા પરિવાર માત્ર નામ નથી, પરંતુ સંસ્કાર, વિશ્વાસ અને એકતાની ઓળખ છે. પેઢીદરપેઢી ચાલતી મૂલ્યોની પરંપરા, મહેનત પ્રત્યે શ્રદ્ધા અને સમાજ પ્રત્યે જવાબદારી આ પરિવારની સાચી તાકાત છે. ધોળકિયા પરિવાર એટલે સંસ્કૃતિની જ્યોત, જે આવનારી પેઢીને સાચા માર્ગે ચાલવાની પ્રેરણા આપે છે.";

  const [text, setText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  // === AUTO TYPING EFFECT ===
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) {
        clearInterval(interval);
        setIsTypingComplete(true);
      }
    }, 40); // Speed of typing

    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="intro"
      className="relative w-full min-h-[85vh] flex items-center overflow-hidden bg-[#fffcf5]"
    >
      {/* ===== 1. ANIMATED BACKGROUND ===== */}
      <div className="absolute inset-0 z-0">
        {/* Background Image with Slow Zoom Effect */}
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: 1.1 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0 bg-cover bg-center opacity-100"
          style={{ backgroundImage: "url('/Background Images/But-BhavaniMaa.jpg')" }}
        />
        {/* Gradient Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#fffcf5]/80 via-[#fffcf5]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#fffcf5]/30 to-[#fffcf5]/80" />
      </div>

      {/* ===== 2. ORNAMENTAL DECORATION ===== */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#7a1f1f]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* ===== 3. MAIN CONTENT ===== */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* === LEFT COLUMN: TEXT CONTENT (Span 7) === */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-1">

            {/* Title Section with Animation */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              <h4 className="text-yellow-600 font-medium tracking-[0.2em] uppercase text-sm md:text-base mb-2">
                Legacy & Tradition
              </h4>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-[#7a1f1f] leading-[1.1] mb-6 drop-shadow-sm">
                Dholakiya <br />
                <span className="italic text-[#9c2a2a]">Parivar</span>
              </h1>
            </motion.div>

            {/* Decorative Divider Animation */}
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "100px" }}
              transition={{ delay: 0.5, duration: 1 }}
              className="h-1 bg-gradient-to-r from-[#7a1f1f] to-yellow-500 rounded-full mb-8"
            />

            {/* Typing Text Area */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="relative w-full"
            >
              {/* Desktop: Standard Paragraph / Mobile: Centered */}
              <p className="text-gray-800 text-lg md:text-xl leading-relaxed font-medium md:min-h-[160px] min-h-[280px]">
                <span className="text-[#7a1f1f] text-2xl font-bold mr-2">❝</span>
                {text}
                <span
                  className={`${isTypingComplete ? "hidden" : "inline-block"
                    } w-[3px] h-6 bg-[#7a1f1f] ml-1 align-middle animate-pulse`}
                />
              </p>
            </motion.div>

            {/* Signature / Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isTypingComplete ? 1 : 0 }}
              transition={{ duration: 1 }}
              className="mt-8"
            >
              <p className="font-serif italic text-gray-500 text-sm">Est. 2024</p>
            </motion.div>
          </div>

          {/* === RIGHT COLUMN: VISUAL / LOGO (Span 5) === */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end order-1 lg:order-2 relative">
            <div className="relative flex items-center justify-center">
              {/* Rotating Background Aura */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[450px] md:h-[450px] border border-dashed border-[#7a1f1f]/20 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] md:w-[380px] md:h-[380px] border border-[#d4af37]/20 rounded-full"
              />

              {/* Main Logo Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
                whileHover={{ scale: 1.05 }}
                //  className="relative z-10 w-64 h-64 md:w-80 md:h-80 p-6 flex items-center justify-center"
                className="relative z-10 w-64 h-64 md:w-80 md:h-80 backdrop-blur-sm rounded-full shadow-2xl border border-black/10 p-2 flex items-center justify-center"
              >
                <img
                  src="/Logo/NewLOGO.png"
                  alt="Dholakiya Parivar Logo"
                  className="w-full h-full object-contain drop-shadow-xl"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section >
  );
}
