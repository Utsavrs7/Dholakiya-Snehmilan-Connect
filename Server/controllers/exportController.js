const Result = require("../src/models/Result");

const applyRankRange = (results, standard, percentageRange) => {
    if (!percentageRange || percentageRange === "all") return results;

    const [fromRaw, toRaw] = String(percentageRange).split("-");
    const from = Number(fromRaw);
    const to = Number(toRaw);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from <= 0 || to < from) {
        return results;
    }

    const filterByTieAwareRank = (items) => {
        let currentRank = 0;
        let prevPercentage = null;
        return items.filter((item, idx) => {
            const pct = Number(item.percentage || 0);
            if (idx === 0) {
                currentRank = 1;
            } else if (pct !== prevPercentage) {
                // Dense rank: 1,2,2,3...
                currentRank += 1;
            }
            prevPercentage = pct;
            return currentRank >= from && currentRank <= to;
        });
    };

    // If standard is "all", apply range inside each standard bucket.
    if (!standard || standard === "all") {
        const groupedByStandard = new Map();
        results.forEach((item) => {
            const key = item.standard || "Unknown";
            if (!groupedByStandard.has(key)) groupedByStandard.set(key, []);
            groupedByStandard.get(key).push(item);
        });

        const filtered = [];
        groupedByStandard.forEach((items) => {
            filtered.push(...filterByTieAwareRank(items));
        });
        return filtered;
    }

    // For a specific standard, apply directly on sorted filtered results.
    return filterByTieAwareRank(results);
};

const sortByStandardThenPercentageDesc = (items = []) =>
    items.sort((a, b) => {
        const standardCmp = String(a.standard || "").localeCompare(String(b.standard || ""), "en", {
            sensitivity: "base",
            numeric: true,
        });
        if (standardCmp !== 0) return standardCmp;
        return Number(b.percentage || 0) - Number(a.percentage || 0);
    });

const addStandardRankMeta = (items = []) => {
    const rankStateByStandard = new Map();
    return items.map((item) => {
        const base = typeof item?.toObject === "function" ? item.toObject() : item;
        const key = base.standard || "Unknown";
        const pct = Number(base.percentage || 0);
        const state = rankStateByStandard.get(key) || { rank: 0, prevPct: null };
        const nextRank = state.rank === 0 ? 1 : (pct === state.prevPct ? state.rank : state.rank + 1);
        rankStateByStandard.set(key, { rank: nextRank, prevPct: pct });
        return { ...base, standardRank: nextRank };
    });
};

const STANDARD_ORDER = [
    "J.K.G",
    "S.K.G",
    "1st",
    "2nd",
    "3rd",
    "4th",
    "5th",
    "6th",
    "7th",
    "8th",
    "9th",
    "10th",
    "11th (Science)",
    "11th (Commerce)",
    "11th (Arts)",
    "12th (Science)",
    "12th (Commerce)",
    "12th (Arts)",
    "Diploma",
    "B.A",
    "B.Com",
    "B.Sc",
    "BSc IT",
    "BBA",
    "BCA",
    "M.A",
    "M.Com",
    "M.Sc",
    "MSc IT",
    "MBA",
    "MCA",
];

const STANDARD_DISPLAY_MAP = {
    "J.K.G": "JKG",
    "S.K.G": "SKG",
    "1st": "1",
    "2nd": "2",
    "3rd": "3",
    "4th": "4",
    "5th": "5",
    "6th": "6",
    "7th": "7",
    "8th": "8",
    "9th": "9",
    "10th": "10",
};

const getStandardDisplay = (standard) => STANDARD_DISPLAY_MAP[standard] || standard || "Unknown";

const groupByStandardInOrder = (items = []) => {
    const grouped = new Map();
    items.forEach((item) => {
        const key = item.standard || "Unknown";
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(item);
    });

    const standardIndex = new Map(STANDARD_ORDER.map((name, index) => [name, index]));
    return Array.from(grouped.entries()).sort((a, b) => {
        const ai = standardIndex.has(a[0]) ? standardIndex.get(a[0]) : Number.MAX_SAFE_INTEGER;
        const bi = standardIndex.has(b[0]) ? standardIndex.get(b[0]) : Number.MAX_SAFE_INTEGER;
        if (ai !== bi) return ai - bi;
        return String(a[0]).localeCompare(String(b[0]), "en", { sensitivity: "base", numeric: true });
    });
};

const GUJARATI_STANDARD_LABEL = "\u0AA7\u0ACB\u0AB0\u0AA3 :-";
const EXCEL_STANDARD_LABEL = "Standard :-";

const escapeHtml = (value = "") =>
    String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

let cachedPuppeteer = null;
let cachedBrowserPromise = null;
let browserCleanupBound = false;

const closeCachedBrowser = async () => {
    if (!cachedBrowserPromise) return;
    try {
        const browser = await cachedBrowserPromise;
        if (browser) await browser.close();
    } catch {
        // Ignore browser close failures during process shutdown.
    } finally {
        cachedBrowserPromise = null;
    }
};

const bindBrowserCleanup = () => {
    if (browserCleanupBound) return;
    browserCleanupBound = true;
    process.once("beforeExit", closeCachedBrowser);
    process.once("SIGINT", async () => {
        await closeCachedBrowser();
        process.exit(0);
    });
    process.once("SIGTERM", async () => {
        await closeCachedBrowser();
        process.exit(0);
    });
};

const getPdfBrowser = async () => {
    if (!cachedPuppeteer) cachedPuppeteer = require("puppeteer");
    if (!cachedBrowserPromise) {
        cachedBrowserPromise = cachedPuppeteer.launch({ headless: true });
        bindBrowserCleanup();
    }
    return cachedBrowserPromise;
};

// Get filter options (unique values for standard, village, medium)
exports.getFilterOptions = async (req, res) => {
    try {
        const acceptedQuery = { status: "accepted" };

        // Filter options should come from accepted results only.
        const standards = await Result.distinct("standard", acceptedQuery);
        const villages = await Result.distinct("village", acceptedQuery);
        const mediums = await Result.distinct("medium", acceptedQuery);

        const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });
        
        res.json({
            standards: standards.sort(collator.compare),
            villages: villages.sort(collator.compare),
            mediums: mediums.sort(collator.compare),
        });
    } catch (error) {
        console.error("Get Filter Options Error:", error);
        res.status(500).json({ message: "Failed to get filter options." });
    }
};

// Preview results (without export)
exports.previewResults = async (req, res) => {
    try {
        const {
            standard,
            medium,
            village,
            percentageRange,
            page = 1,
            limit = 25,
        } = req.body;

        // --- Build Query ---
        const query = {};
        
        // Only apply filters if not "all"
        if (standard && standard !== "all") query.standard = standard;
        if (medium && medium !== "all") query.medium = medium;
        if (village && village !== "all") query.village = village;

        // Fetch Data - sorted by percentage descending
        let results = await Result.find(query).sort({ percentage: -1 });

        results = applyRankRange(results, standard, percentageRange);
        results = sortByStandardThenPercentageDesc(results);

        const total = results.length;
        const requestedPage = Math.max(1, Number(page) || 1);
        const limitNum = Math.max(1, Math.min(100, Number(limit) || 25));
        const pages = Math.max(1, Math.ceil(total / limitNum));
        const pageNum = Math.min(requestedPage, pages);
        const start = (pageNum - 1) * limitNum;
        const end = start + limitNum;
        const pagedData = results.slice(start, end);

        res.json({
            data: pagedData,
            total,
            showing: pagedData.length,
            page: pageNum,
            limit: limitNum,
            pages,
        });
    } catch (error) {
        console.error("Preview Error:", error);
        res.status(500).json({ message: "Failed to preview results." });
    }
};

exports.exportResults = async (req, res) => {
    try {
        let ExcelJS;
        try {
            ExcelJS = require("exceljs");
        } catch (depError) {
            return res.status(500).json({
                message: "Export dependencies missing on server. Please install exceljs.",
            });
        }

        const {
            standard,
            medium,
            village,
            percentageRange,
            format, // 'pdf' or 'excel'
        } = req.body;
        const exportYear = new Date().getFullYear();

        // --- Build Query ---
        const query = {};
        
        // Only apply filters if not "all"
        if (standard && standard !== "all") query.standard = standard;
        if (medium && medium !== "all") query.medium = medium;
        if (village && village !== "all") query.village = village;

        // Fetch Data - sorted by percentage descending
        let results = await Result.find(query).sort({ percentage: -1 });

        results = applyRankRange(results, standard, percentageRange);
        results = sortByStandardThenPercentageDesc(results);
        const rankedResults = addStandardRankMeta(results);
        const groupedStandardResults = groupByStandardInOrder(rankedResults);

        if (!results.length) {
            return res.status(404).json({ message: "No matching results found to export." });
        }

        // --- EXCEL EXPORT ---
        if (format === "excel") {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Student Results");
            const currentYear = new Date().getFullYear();
            const generatedAt = new Date().toLocaleString();
            const filterText = `Filters: ${standard || "All"} | ${medium || "All"} | ${village || "All"} | Range: ${percentageRange || "All"}`;

            worksheet.columns = [
                { header: "", key: "rank", width: 10 },
                { header: "", key: "full_name", width: 46 },
                { header: "", key: "percentage", width: 16 },
            ];

            const mainTitleRow = worksheet.addRow({});
            mainTitleRow.getCell("A").value = `Snehmilan Results - ${currentYear}`;
            worksheet.mergeCells(`A${mainTitleRow.number}:C${mainTitleRow.number}`);
            mainTitleRow.alignment = { horizontal: "center", vertical: "middle" };
            mainTitleRow.font = { name: "Nirmala UI", bold: true, size: 18 };

            const generatedRow = worksheet.addRow({});
            generatedRow.getCell("A").value = `Generated on: ${generatedAt}`;
            worksheet.mergeCells(`A${generatedRow.number}:C${generatedRow.number}`);
            generatedRow.alignment = { horizontal: "left", vertical: "middle" };
            generatedRow.font = { name: "Nirmala UI", size: 11 };

            const filtersRow = worksheet.addRow({});
            filtersRow.getCell("A").value = filterText;
            worksheet.mergeCells(`A${filtersRow.number}:C${filtersRow.number}`);
            filtersRow.alignment = { horizontal: "left", vertical: "middle" };
            filtersRow.font = { name: "Nirmala UI", size: 11 };

            worksheet.addRow({});
            worksheet.addRow({});

            groupedStandardResults.forEach(([standard, students], sectionIndex) => {
                if (sectionIndex > 0) {
                    worksheet.addRow({});
                    worksheet.addRow({});
                }

                const titleRow = worksheet.addRow({});
                titleRow.getCell("A").value = `${EXCEL_STANDARD_LABEL} ${getStandardDisplay(standard)}`;
                worksheet.mergeCells(`A${titleRow.number}:C${titleRow.number}`);
                titleRow.alignment = { horizontal: "center", vertical: "middle" };
                titleRow.font = { name: "Nirmala UI", bold: true, size: 13 };
                titleRow.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF2F2F2" },
                };

                students.forEach((student) => {
                    const row = worksheet.addRow({
                        rank: `${student.standardRank}.`,
                        full_name: student.full_name,
                        percentage: `${student.percentage}%`,
                    });
                    row.font = { name: "Nirmala UI", bold: student.standardRank <= 3 };
                });
            });

            // Set Response
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=Snehmilan_${exportYear}.xlsx`
            );

            await workbook.xlsx.write(res);
            res.end();
        }

        // --- PDF EXPORT ---
        else if (format === "pdf") {
            try {
                await getPdfBrowser();
            } catch (depError) {
                return res.status(500).json({
                    message: "PDF engine missing. Install with: npm i puppeteer (inside Server folder).",
                });
            }

            const currentYear = new Date().getFullYear();
            const generatedAt = new Date().toLocaleString();
            const filterText = `Filters: ${standard || "All"} | ${medium || "All"} | ${village || "All"} | Range: ${percentageRange || "All"}`;
            const sectionsHtml = groupedStandardResults
                .map(([std, students]) => {
                    const rows = students
                        .map((student) => {
                            const boldClass = student.standardRank <= 3 ? "top-rank" : "";
                            return `<tr class="${boldClass}">
                                <td class="rank">${student.standardRank}.</td>
                                <td class="name">${escapeHtml(student.full_name)}</td>
                                <td class="pct">${escapeHtml(`${student.percentage}%`)}</td>
                            </tr>`;
                        })
                        .join("");

                    return `<section class="std-block">
                        <h3>${escapeHtml(`${GUJARATI_STANDARD_LABEL} ${getStandardDisplay(std)}`)}</h3>
                        <table>
                            <tbody>${rows}</tbody>
                        </table>
                    </section>`;
                })
                .join("");

            const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 16mm 12mm; }
    body {
      font-family: "Nirmala UI", "Shruti", "Noto Sans Gujarati", sans-serif;
      color: #111;
      font-size: 12px;
    }
    .header {
      border: 1px solid #cfcfcf;
      border-radius: 8px;
      background: #f6f6f6;
      padding: 10px 12px;
      margin-bottom: 14px;
    }
    .title {
      text-align: center;
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .meta {
      font-size: 11px;
      line-height: 1.45;
    }
    .std-block {
      margin-bottom: 14px;
      break-inside: avoid;
    }
    .std-block h3 {
      margin: 0 0 6px 0;
      padding: 6px 8px;
      background: #f0f0f0;
      border: 1px solid #dcdcdc;
      border-radius: 6px;
      text-align: center;
      font-size: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    tr { border-bottom: 1px solid #ececec; }
    td {
      padding: 5px 6px;
      vertical-align: top;
    }
    td.rank { width: 9%; }
    td.name { width: 71%; padding-right: 8px; }
    td.pct { width: 20%; text-align: right; white-space: nowrap; }
    .top-rank td { font-weight: 700; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Snehmilan Results - ${currentYear}</div>
    <div class="meta">Generated on: ${escapeHtml(generatedAt)}</div>
    <div class="meta">${escapeHtml(filterText)}</div>
  </div>
  ${sectionsHtml}
</body>
</html>`;

            const browser = await getPdfBrowser();
            let page = null;
            try {
                page = await browser.newPage();
                await page.setContent(html, { waitUntil: "domcontentloaded" });
                const pdfBuffer = await page.pdf({
                    format: "A4",
                    printBackground: true,
                    margin: { top: "12mm", right: "10mm", bottom: "12mm", left: "10mm" },
                });

                res.setHeader("Content-Type", "application/pdf");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename=Snehmilan_${exportYear}.pdf`
                );
                res.send(Buffer.from(pdfBuffer));
            } finally {
                if (page) await page.close();
            }
        } else {
            res.status(400).json({ message: "Invalid format specified." });
        }
    } catch (error) {
        console.error("Export Error:", error);
        res.status(500).json({ message: "Failed to export results." });
    }
};





