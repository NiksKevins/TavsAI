import type { IndustryTemplate } from "@prisma/client";

export type QualificationQuestion = {
  key: string;
  labelLv: string;
  labelEn: string;
  required?: boolean;
};

export type LeadFieldDef = {
  key: string;
  labelLv: string;
  labelEn: string;
  required?: boolean;
};

export type MinLeadCriteria = {
  /** Require purchase/booking intent signal */
  requireIntent: boolean;
  /** Require phone or email */
  requireContact: boolean;
  /** Require a name */
  requireName: boolean;
  /** Require extracted/requested service */
  requireService: boolean;
};

export const DEFAULT_MIN_LEAD_CRITERIA: MinLeadCriteria = {
  requireIntent: true,
  requireContact: true,
  requireName: false,
  requireService: false,
};

export const DEFAULT_LEAD_FIELDS: LeadFieldDef[] = [
  { key: "name", labelLv: "Vārds", labelEn: "Name", required: true },
  { key: "phone", labelLv: "Tālrunis", labelEn: "Phone", required: true },
  { key: "email", labelLv: "E-pasts", labelEn: "Email", required: false },
];

const CONSTRUCTION_QS: QualificationQuestion[] = [
  {
    key: "project_type",
    labelLv: "Projekta tips?",
    labelEn: "Project type?",
    required: true,
  },
  {
    key: "location",
    labelLv: "Atrašanās vieta?",
    labelEn: "Location?",
    required: true,
  },
  {
    key: "area",
    labelLv: "Aptuvenā platība?",
    labelEn: "Approximate area?",
  },
  {
    key: "start_date",
    labelLv: "Vēlamais sākuma datums?",
    labelEn: "Desired start date?",
  },
  {
    key: "budget",
    labelLv: "Budžets?",
    labelEn: "Budget?",
  },
];

const AUTOMOTIVE_QS: QualificationQuestion[] = [
  {
    key: "car_model",
    labelLv: "Automašīnas modelis?",
    labelEn: "Car model?",
    required: true,
  },
  {
    key: "year",
    labelLv: "Gads?",
    labelEn: "Year?",
    required: true,
  },
  {
    key: "problem",
    labelLv: "Problēma?",
    labelEn: "Problem?",
    required: true,
  },
  {
    key: "preferred_date",
    labelLv: "Vēlamais datums?",
    labelEn: "Preferred date?",
  },
];

const BEAUTY_QS: QualificationQuestion[] = [
  {
    key: "service",
    labelLv: "Pakalpojums?",
    labelEn: "Service?",
    required: true,
  },
  {
    key: "preferred_date",
    labelLv: "Vēlamais datums?",
    labelEn: "Preferred date?",
    required: true,
  },
  {
    key: "preferred_employee",
    labelLv: "Vēlamais meistars?",
    labelEn: "Preferred employee?",
  },
];

export const INDUSTRY_QUALIFICATION: Record<
  IndustryTemplate,
  QualificationQuestion[]
> = {
  CONSTRUCTION: CONSTRUCTION_QS,
  AUTOMOTIVE: AUTOMOTIVE_QS,
  BEAUTY_SALON: BEAUTY_QS,
  BARBER: BEAUTY_QS,
  REAL_ESTATE: [
    {
      key: "property_type",
      labelLv: "Īpašuma tips?",
      labelEn: "Property type?",
      required: true,
    },
    {
      key: "location",
      labelLv: "Atrašanās vieta?",
      labelEn: "Location?",
      required: true,
    },
    {
      key: "budget",
      labelLv: "Budžets?",
      labelEn: "Budget?",
    },
  ],
  RESTAURANT: [
    {
      key: "party_size",
      labelLv: "Cilvēku skaits?",
      labelEn: "Party size?",
      required: true,
    },
    {
      key: "preferred_date",
      labelLv: "Datums?",
      labelEn: "Date?",
      required: true,
    },
  ],
  DENTAL_CLINIC: [
    {
      key: "service",
      labelLv: "Vēlamais pakalpojums?",
      labelEn: "Desired service?",
      required: true,
    },
    {
      key: "preferred_date",
      labelLv: "Vēlamais datums?",
      labelEn: "Preferred date?",
    },
  ],
  PROFESSIONAL_SERVICES: [
    {
      key: "need",
      labelLv: "Kāda palīdzība nepieciešama?",
      labelEn: "What do you need help with?",
      required: true,
    },
    {
      key: "timeline",
      labelLv: "Termiņš?",
      labelEn: "Timeline?",
    },
  ],
  OTHER: [
    {
      key: "need",
      labelLv: "Ko vēlaties saņemt?",
      labelEn: "What are you looking for?",
      required: true,
    },
    {
      key: "preferred_date",
      labelLv: "Vēlamais datums?",
      labelEn: "Preferred date?",
    },
  ],
};

export function qualificationForIndustry(
  industry: IndustryTemplate | null | undefined,
): QualificationQuestion[] {
  return INDUSTRY_QUALIFICATION[industry ?? "OTHER"] ?? INDUSTRY_QUALIFICATION.OTHER;
}
