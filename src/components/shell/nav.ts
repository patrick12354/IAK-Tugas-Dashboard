import { ChartLine, Database, Landmark, LayoutGrid, Layers, Wallet } from "lucide-react";

export const NAV_GROUPS = [
  {
    label: "Analisis",
    items: [
      { href: "/dashboard", hash: "", label: "Ringkasan", icon: LayoutGrid },
      { href: "/dashboard", hash: "suku-bunga", label: "Suku bunga", icon: ChartLine },
      { href: "/dashboard", hash: "kredit", label: "Kredit sektoral", icon: Layers },
      { href: "/dashboard", hash: "uang-beredar", label: "Uang beredar", icon: Wallet },
      { href: "/dashboard", hash: "bank", label: "Kelompok bank", icon: Landmark },
    ],
  },
  {
    label: "Data",
    items: [{ href: "/dashboard/data", hash: "", label: "Data & ETL", icon: Database }],
  },
] as const;

export const SECTION_IDS = ["suku-bunga", "kredit", "uang-beredar", "bank"] as const;
