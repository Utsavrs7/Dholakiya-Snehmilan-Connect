import { useState } from "react";
import { FaFilePdf, FaFileExcel, FaDownload, FaTimes } from "react-icons/fa";
import { getAdminTokenFor } from "../../utils/adminAuth";
import { VILLAGE_OPTIONS } from "../../constants/villageOptions";

const STANDARD_OPTIONS = [
    "All",
    "J.K.G", "S.K.G", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th",
    "11th (Science)", "11th (Commerce)", "11th (Arts)",
    "12th (Science)", "12th (Commerce)", "12th (Arts)",
    "Diploma", "B.A", "B.Com", "B.Sc", "BSc IT", "BBA", "BCA",
    "M.A", "M.Com", "M.Sc", "MSc IT", "MBA", "MCA"
];

const VILLAGE_FILTER_OPTIONS = ["All", ...VILLAGE_OPTIONS.map((village) => village.value)];

export default function ExportResultModal({ onClose }) {
    const [filters, setFilters] = useState({
        standard: "",
        medium: "",
        village: "",
        stream: "",
        minPercentage: "",
        maxPercentage: "",
        format: "pdf", // 'pdf' or 'excel'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleExport = async () => {
        setLoading(true);
        setError("");
        try {
            const token = getAdminTokenFor("super_admin");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/export/results`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...filters,
                    standard: filters.standard === "All" ? "" : filters.standard,
                    village: filters.village === "All" ? "" : filters.village,
                    medium: filters.medium === "All" ? "" : filters.medium,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Export failed");
            }

            // Handle File Download
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const ext = filters.format === "excel" ? "xlsx" : "pdf";
            const year = new Date().getFullYear();
            a.download = `Snehmilan_${year}.${ext}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            onClose(); // Close modal on success
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-[#0f172a]">
                    <h3 className="text-xl font-bold text-[#7a1f1f] dark:text-[#e2e8f0]">Export Results</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-4">
                    {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

                    {/* Filters Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {/* Standard */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Standard</label>
                            <select
                                name="standard"
                                value={filters.standard}
                                onChange={handleChange}
                                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#334155] text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#7a1f1f] focus:outline-none"
                            >
                                {STANDARD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>

                        {/* Medium */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Medium</label>
                            <select
                                name="medium"
                                value={filters.medium}
                                onChange={handleChange}
                                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#334155] text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#7a1f1f] focus:outline-none"
                            >
                                <option value="All">All</option>
                                <option value="English">English</option>
                                <option value="Gujarati">Gujarati</option>
                            </select>
                        </div>

                        {/* Village */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Village</label>
                            <select
                                name="village"
                                value={filters.village}
                                onChange={handleChange}
                                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#334155] text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#7a1f1f] focus:outline-none"
                            >
                                {VILLAGE_FILTER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>

                        {/* Stream Filter (Optional text input for specific streams/courses) */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Stream / Other Std</label>
                            <input
                                type="text"
                                name="stream"
                                value={filters.stream}
                                onChange={handleChange}
                                placeholder="e.g. Science, B.Com"
                                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#334155] text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#7a1f1f] focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Percentage Range */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Min %</label>
                            <input
                                type="number"
                                name="minPercentage"
                                value={filters.minPercentage}
                                onChange={handleChange}
                                min="0" max="100"
                                placeholder="0"
                                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#334155] text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#7a1f1f] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Max %</label>
                            <input
                                type="number"
                                name="maxPercentage"
                                value={filters.maxPercentage}
                                onChange={handleChange}
                                min="0" max="100"
                                placeholder="100"
                                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#334155] text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#7a1f1f] focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Format Selection */}
                    <div className="pt-4">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Export Format</label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${filters.format === 'pdf' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-2 ring-red-500 ring-offset-2 dark:ring-offset-[#1e293b]' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                <input type="radio" name="format" value="pdf" checked={filters.format === 'pdf'} onChange={handleChange} className="hidden" />
                                <FaFilePdf size={24} className={filters.format === 'pdf' ? 'text-red-600' : 'text-gray-400'} />
                                <span className="font-semibold text-sm">PDF Document</span>
                            </label>

                            <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${filters.format === 'excel' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-2 ring-green-500 ring-offset-2 dark:ring-offset-[#1e293b]' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                <input type="radio" name="format" value="excel" checked={filters.format === 'excel'} onChange={handleChange} className="hidden" />
                                <FaFileExcel size={24} className={filters.format === 'excel' ? 'text-green-600' : 'text-gray-400'} />
                                <span className="font-semibold text-sm">Excel Spreadsheet</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-[#0f172a] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-lg font-semibold text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={loading}
                        className="px-6 py-2.5 rounded-lg bg-[#7a1f1f] text-white font-bold shadow-lg hover:bg-[#902424] hover:shadow-xl active:translate-y-0.5 transition-all disabled:opacity-70 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            <>
                                <FaDownload />
                                Download Result
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}




