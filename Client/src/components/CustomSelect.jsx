import { useState, useRef, useEffect } from "react";

export default function CustomSelect({
    options,
    value,
    onChange,
    placeholder,
    name,
    className,
    required
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        // Mimic the event object for parent handler
        onChange({ target: { name, value: optionValue } });
        setIsOpen(false);
    };

    // Helper to get display label
    const getLabel = (val) => {
        if (!val) return placeholder;
        // For village options which are objects
        if (options.length > 0 && typeof options[0] === 'object') {
            const found = options.find(o => o.value === val);
            return found ? found.label : val;
        }
        return val;
    };

    const displayLabel = getLabel(value);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div
                className={`${className} cursor-pointer flex justify-between items-center relative`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`flex-1 text-center truncate ${!value ? 'text-[#7a1f1f]/40' : 'text-[#7a1f1f]'}`}>
                    {displayLabel}
                </span>
                <svg
                    className={`w-5 h-5 text-[#7a1f1f] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} absolute right-3 shrink-0`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && (
                <ul className="absolute z-50 w-full mt-2 bg-white border border-[#7a1f1f]/20 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] max-h-56 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <li
                        onClick={() => handleSelect("")}
                        className="px-4 py-3 text-center cursor-pointer hover:bg-[#fff8ee] transition-colors text-[#7a1f1f]/60 italic border-b border-[#7a1f1f]/5 text-sm"
                    >
                        {placeholder}
                    </li>
                    {options.map((option) => {
                        const optValue = typeof option === 'object' ? option.value : option;
                        const optLabel = typeof option === 'object' ? option.label : option;

                        return (
                            <li
                                key={optValue}
                                onClick={() => handleSelect(optValue)}
                                className={`px-4 py-3 text-center cursor-pointer hover:bg-[#fff8ee] transition-colors text-[#7a1f1f] border-b border-[#7a1f1f]/5 last:border-0 ${value === optValue ? 'bg-[#7a1f1f]/5 font-semibold' : ''}`}
                            >
                                {optLabel}
                            </li>
                        );
                    })}
                </ul>
            )}
            {/* Hidden input for HTML validation if needed, though we handle validation manually mostly */}
            <input
                tabIndex={-1}
                className="opacity-0 absolute h-0 w-0 pointer-events-none"
                value={value}
                onChange={() => { }}
                required={required}
            />
        </div>
    );
}
