const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const MONTHS_LONG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

/** '2026-07' -> 'Jul 2026' */
export const fmtPeriod = (p: string) => `${MONTHS_ID[Number(p.slice(5, 7)) - 1]} ${p.slice(0, 4)}`;
export const fmtPeriodLong = (p: string) => `${MONTHS_LONG[Number(p.slice(5, 7)) - 1]} ${p.slice(0, 4)}`;

export const fmtNum = (n: number, digits = 0) =>
  n.toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtPct = (n: number, digits = 2) => `${fmtNum(n, digits)}%`;

export const fmtSigned = (n: number, digits = 1, suffix = "") => `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmtNum(Math.abs(n), digits)}${suffix}`;

/** nilai dalam miliar rupiah -> "Rp 8.969,7 T" */
export const fmtTriliun = (miliar: number, digits = 1) => `Rp ${fmtNum(miliar / 1000, digits)} T`;
