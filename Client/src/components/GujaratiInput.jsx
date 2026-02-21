import { useState, useEffect, useRef } from 'react';

export default function GujaratiInput({
    value,
    onChange,
    name,
    placeholder,
    className,
    required = false,
    minLength,
    inputRef,
}) {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const fallbackRef = useRef(null);
    const activeInputRef = inputRef || fallbackRef;
    const suggestionsRef = useRef(null);
    const API = import.meta.env.VITE_API_URL;
    const cleanedSuggestions = suggestions
        .map((s) => String(s || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                activeInputRef.current &&
                !activeInputRef.current.contains(event.target) &&
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        return () => {
            // Cleanup debounced timer on unmount
        };
    }, []);

    const fetchSuggestions = async (text) => {
        if (!text || !text.trim()) {
            setSuggestions([]);
            return;
        }

        // Skip if already Gujarati
        if (/^[\u0A80-\u0AFF\s]+$/.test(text)) {
            setSuggestions([]);
            return;
        }

        try {
            const response = await fetch(
                `${API}/api/proxy/input-tools?text=${encodeURIComponent(text)}&itc=gu-t-i0-und`
            );
            if (response.ok) {
                const data = await response.json();
                // Google Input Tools response format: ["SUCCESS", [["input_word", ["suggestion1", "suggestion2"], ...]]]
                if (data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1]) {
                    setSuggestions(data[1][0][1]);
                    setShowSuggestions(true);
                    setActiveIndex(0);
                }
            }
        } catch (error) {
            console.error('Error fetching Gujarati suggestions:', error);
            if (error.message && error.message.includes('Failed to fetch')) {
                console.warn('Backend server might be down. Please check if server is running on port 5000.');
            }
        }
    };

    const activeTimeout = useRef(null);

    const handleInputChange = (e) => {
        const newVal = e.target.value;
        onChange(e);

        if (activeTimeout.current) clearTimeout(activeTimeout.current);

        activeTimeout.current = setTimeout(() => {
            const words = newVal.split(/\s+/);
            const lastWord = words[words.length - 1];

            if (lastWord && /^[a-zA-Z]+$/.test(lastWord)) {
                fetchSuggestions(lastWord);
            } else {
                setShowSuggestions(false);
            }
        }, 300);
    };

    const hasEnglishTail = (textValue) => {
        const words = String(textValue || '').trim().split(/\s+/).filter(Boolean);
        if (!words.length) return false;
        return /^[a-zA-Z]+$/.test(words[words.length - 1]);
    };

    const handleSelection = (suggestion) => {
        const words = value.trim().split(/\s+/).filter(Boolean);
        words.pop(); // Remove the partial English word
        words.push(String(suggestion || '').replace(/\s+/g, ' ').trim()); // Add sanitized Gujarati suggestion

        // Create synthetic event
        const newValue = words.join(' ') + ' ';

        // Manually trigger onChange with the new value
        onChange({
            target: {
                name,
                value: newValue,
                type: 'text'
            }
        });

        setShowSuggestions(false);
        setSuggestions([]);
        if (activeInputRef.current) {
            activeInputRef.current.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((prev) => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            if (showSuggestions) {
                e.preventDefault();
                handleSelection(cleanedSuggestions[activeIndex] || cleanedSuggestions[0]);
            }
        } else if (e.key === ' ') {
            if (showSuggestions && cleanedSuggestions.length > 0) {
                e.preventDefault();
                handleSelection(cleanedSuggestions[activeIndex] || cleanedSuggestions[0]);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const handleBlur = () => {
        // If user leaves field with English tail, auto-apply first Gujarati suggestion.
        if (showSuggestions && cleanedSuggestions.length > 0 && hasEnglishTail(value)) {
            handleSelection(cleanedSuggestions[0]);
            return;
        }
        setShowSuggestions(false);
    };

    return (
        <div className="relative w-full">
            <input
                ref={activeInputRef}
                type="text"
                name={name}
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder={placeholder}
                className={className}
                required={required}
                minLength={minLength}
                autoComplete="on"
                autoCorrect="on"
                spellCheck={true}
                lang="gu"
            />

            {showSuggestions && cleanedSuggestions.length > 0 && (
                <ul
                    ref={suggestionsRef}
                    className="absolute z-[9999] w-full left-0 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1"
                    style={{ top: '100%' }}
                >
                    {cleanedSuggestions.map((suggestion, index) => (
                        <li
                            key={index}
                            className={`px-4 py-2 cursor-pointer flex justify-between items-center ${index === activeIndex ? 'bg-green-50 text-green-900 font-semibold' : 'hover:bg-gray-100'
                                }`}
                            onMouseDown={(e) => {
                                e.preventDefault(); // Prevent blur before click
                                handleSelection(suggestion);
                            }}
                        >
                            <span>{suggestion}</span>
                            <span className="text-xs text-gray-400">{index + 1}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
