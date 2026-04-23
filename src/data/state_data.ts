// src/data/state_data.ts
// Production-ready v1 dataset: 50 states + D.C.
// Notes:
// - Postpartum coverage reflects Medicaid postpartum extension policy status.
// - Paid Family Leave reflects statewide PFML wage-replacement programs (not “state employees only” leave).

export type StateAbbr =
  | "AL"
  | "AK"
  | "AZ"
  | "AR"
  | "CA"
  | "CO"
  | "CT"
  | "DE"
  | "DC"
  | "FL"
  | "GA"
  | "HI"
  | "ID"
  | "IL"
  | "IN"
  | "IA"
  | "KS"
  | "KY"
  | "LA"
  | "ME"
  | "MD"
  | "MA"
  | "MI"
  | "MN"
  | "MS"
  | "MO"
  | "MT"
  | "NE"
  | "NV"
  | "NH"
  | "NJ"
  | "NM"
  | "NY"
  | "NC"
  | "ND"
  | "OH"
  | "OK"
  | "OR"
  | "PA"
  | "RI"
  | "SC"
  | "SD"
  | "TN"
  | "TX"
  | "UT"
  | "VT"
  | "VA"
  | "WA"
  | "WV"
  | "WI"
  | "WY";

export type TrustedLink = {
  label: string;
  url: string;
};

export type ImmediateHelpItem = {
  label: string;
  contact?: string; // phone (digits + symbols)
  url?: string; // https
};

export type StateSnapshot = {
  abbr: StateAbbr;
  name: string;

  // “What users feel informed by” (v1)
  postpartumCoverage: {
    summary: string; // short, card-friendly
    detail?: string; // optional extra line for edge cases
  };

  paidFamilyLeave: {
    hasStatewidePFML: boolean;
    summary: string; // short, card-friendly
    detail?: string; // optional extra line
    officialProgramUrl?: string; // optional official state program page
  };

  // State-specific rights summary built from federal baselines plus high-trust state deltas
  rightsSummary: string[];

  // Official state-specific support links
  trustedSupportLinks: TrustedLink[];

  // “Immediate help” that works in every state (still shown under “Your state”)
  immediateHelp: ImmediateHelpItem[];
};

type ProtectionScope = "federal_only" | "limited_scope" | "statewide_or_broad";

const PFML_ACTIVE_STATES: Set<StateAbbr> = new Set([
  "CA",
  "CO",
  "CT",
  "DE",
  "MA",
  "MN",
  "NJ",
  "NY",
  "OR",
  "RI",
  "WA",
  "DC",
]);

const PFML_ENACTED_STATES: Set<StateAbbr> = new Set([
  "ME",
  "MD",
]);

function postpartumSummaryForState(
  abbr: StateAbbr,
): StateSnapshot["postpartumCoverage"] {
  const stateName =
    abbr === "DC"
      ? "the District of Columbia"
      : STATE_NAMES[abbr];

  // Source: KFF (Kaiser Family Foundation) Medicaid Postpartum Coverage Extension Tracker
  // https://www.kff.org/medicaid/issue-brief/medicaid-postpartum-coverage-extension-tracker/
  // Last reviewed: 2025-05-29. Check the tracker above for any policy changes and update AR/WI entries as needed.
  // As of that date, all states except AR and WI had adopted 12-month postpartum Medicaid coverage extensions.
  // WI has reported movement in 2026; keep it explicit (no silent assumptions).
  if (abbr === "AR") {
    return {
      summary: `In ${stateName}, Medicaid postpartum coverage has not been extended to 12 months`,
      detail:
        "Default postpartum Medicaid coverage may be shorter than 12 months. Check with your local Medicaid office to confirm your current coverage period.",
    };
  }
  if (abbr === "WI") {
    return {
      summary: `In ${stateName}, Medicaid postpartum coverage appears to be moving toward a 12-month extension`,
      detail:
        "Recent reporting indicates expansion activity; confirm effective date.",
    };
  }
  return {
    summary: `${stateName[0].toUpperCase()}${stateName.slice(1)} provides 12 months of Medicaid postpartum coverage`,
  };
}

function pfmlSummary(abbr: StateAbbr): StateSnapshot["paidFamilyLeave"] {
  if (abbr === "DC") {
    return {
      hasStatewidePFML: true,
      summary: "D.C. Paid Family Leave benefits are available now",
      detail:
        "D.C. provides paid parental, family, and medical leave, plus prenatal leave.",
      officialProgramUrl: PFML_PROGRAM_URLS[abbr],
    };
  }

  if (abbr === "CA") {
    return {
      hasStatewidePFML: true,
      summary: "California Paid Family Leave benefits are available now",
      detail:
        "California workers may pair Paid Family Leave with other state disability or pregnancy-related benefits depending on eligibility.",
      officialProgramUrl: PFML_PROGRAM_URLS[abbr],
    };
  }

  if (abbr === "CO") {
    return {
      hasStatewidePFML: true,
      summary: "Colorado Family and Medical Leave Insurance (FAMLI) benefits are available now",
      officialProgramUrl: PFML_PROGRAM_URLS[abbr],
    };
  }

  if (abbr === "CT") {
    return {
      hasStatewidePFML: true,
      summary: "Connecticut Paid Leave benefits are available now",
      officialProgramUrl: PFML_PROGRAM_URLS[abbr],
    };
  }

  if (abbr === "MA") {
    return {
      hasStatewidePFML: true,
      summary: "Massachusetts Paid Family and Medical Leave benefits are available now",
      officialProgramUrl: PFML_PROGRAM_URLS[abbr],
    };
  }

  if (abbr === "MD") {
    return {
      hasStatewidePFML: true,
      summary: "Maryland FAMLI is enacted statewide",
      detail:
        "Maryland says payroll contributions begin in January 2027; check the official state program for current rollout dates.",
      officialProgramUrl: PFML_PROGRAM_URLS[abbr],
    };
  }

  if (abbr === "ME") {
    return {
      hasStatewidePFML: true,
      summary: "Maine Paid Family and Medical Leave is enacted statewide",
      detail:
        "Maine says paid leave benefits begin May 1, 2026.",
      officialProgramUrl: PFML_PROGRAM_URLS[abbr],
    };
  }

  if (abbr === "MN") {
    return {
      hasStatewidePFML: true,
      summary: "Minnesota Paid Leave benefits are available now",
      detail:
        "Minnesota says paid leave payments and job protections started January 1, 2026.",
      officialProgramUrl: PFML_PROGRAM_URLS[abbr],
    };
  }

  if (abbr === "NJ") {
    return {
      hasStatewidePFML: true,
      summary: "New Jersey Family Leave Insurance benefits are available now",
      officialProgramUrl: PFML_PROGRAM_URLS[abbr],
    };
  }

  if (abbr === "NY") {
    return {
      hasStatewidePFML: true,
      summary: "New York Paid Family Leave benefits are available now",
      officialProgramUrl: PFML_PROGRAM_URLS[abbr],
    };
  }

  if (abbr === "OR") {
    return {
      hasStatewidePFML: true,
      summary: "Oregon Paid Leave benefits are available now",
      officialProgramUrl: PFML_PROGRAM_URLS[abbr],
    };
  }

  if (abbr === "RI") {
    return {
      hasStatewidePFML: true,
      summary: "Rhode Island Temporary Caregiver Insurance benefits are available now",
      officialProgramUrl: PFML_PROGRAM_URLS[abbr],
    };
  }

  if (abbr === "WA") {
    return {
      hasStatewidePFML: true,
      summary: "Washington Paid Family and Medical Leave benefits are available now",
      officialProgramUrl: PFML_PROGRAM_URLS[abbr],
    };
  }

  if (abbr === "DE") {
    return {
      hasStatewidePFML: true,
      summary: "Delaware Paid Leave benefits are available now",
      detail:
        "Delaware says claims filing began January 1, 2026.",
      officialProgramUrl: PFML_PROGRAM_URLS[abbr],
    };
  }

  if (PFML_ACTIVE_STATES.has(abbr)) {
    return {
      hasStatewidePFML: true,
      summary: "Statewide paid family & medical leave benefits are available",
      officialProgramUrl: PFML_PROGRAM_URLS[abbr],
    };
  }

  if (PFML_ENACTED_STATES.has(abbr)) {
    return {
      hasStatewidePFML: true,
      summary: "Statewide paid family & medical leave program is enacted",
      detail: "Check the official state program for current contribution and benefit dates.",
      officialProgramUrl: PFML_PROGRAM_URLS[abbr],
    };
  }

  return {
    hasStatewidePFML: false,
    summary: `${STATE_NAMES[abbr]} does not currently have a statewide paid family leave program`,
    detail:
      "Ask about employer leave, short-term disability, and whether you qualify for unpaid FMLA leave.",
  };
}

const STATE_NAMES: Record<StateAbbr, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

const STATE_MEDICAID_URLS: Record<StateAbbr, string> = {
  AL: "https://medicaid.alabama.gov/",
  AK: "https://health.alaska.gov/en/services/division-of-public-assistance-services/apply-for-medicaid/",
  AZ: "https://azahcccs.gov/",
  AR: "https://humanservices.arkansas.gov/",
  CA: "https://www.dhcs.ca.gov/",
  CO: "https://www.healthfirstcolorado.com/",
  CT: "https://portal.ct.gov/Services/Health-and-Human-Services",
  DE: "https://www.dhss.delaware.gov/dhss/dmma/",
  DC: "https://districtdirect.dc.gov/ua/",
  FL: "https://ahca.myflorida.com/",
  GA: "https://dch.georgia.gov/",
  HI: "https://medquest.hawaii.gov/",
  ID: "https://healthandwelfare.idaho.gov/",
  IL: "https://hfs.illinois.gov/medicalclients.html",
  IN: "https://www.in.gov/fssa/dfr/",
  IA: "https://hhs.iowa.gov/",
  KS: "https://kancare.ks.gov/",
  KY: "https://chfs.ky.gov/",
  LA: "https://ldh.la.gov/subhome/48",
  ME: "https://www.maine.gov/dhhs/",
  MD: "https://health.maryland.gov/mmcp/Pages/MedicaidCheckIn-Participants.aspx",
  MA: "https://www.mass.gov/topics/masshealth",
  MI: "https://www.michigan.gov/mdhhs/",
  MN: "https://mn.gov/dhs/",
  MS: "https://medicaid.ms.gov/medicaid-coverage/",
  MO: "https://dss.mo.gov/",
  MT: "https://dphhs.mt.gov/",
  NE: "https://dhhs.ne.gov/",
  NV: "http://dhhs.nv.gov/",
  NH: "https://www.dhhs.nh.gov/",
  NJ: "https://www.state.nj.us/humanservices/",
  NM: "https://www.hsd.state.nm.us/",
  NY: "https://www.health.ny.gov/health_care/medicaid/changes/",
  NC: "https://medicaid.ncdhhs.gov/",
  ND: "https://www.applyforhelp.nd.gov/",
  OH: "https://medicaid.ohio.gov/",
  OK: "https://oklahoma.gov/ohca.html",
  OR: "https://one.oregon.gov/",
  PA: "https://www.dhs.pa.gov/",
  RI: "http://www.eohhs.ri.gov/",
  SC: "https://www.scdhhs.gov/",
  SD: "https://dss.sd.gov/",
  TN: "https://www.tn.gov/health.html",
  TX: "https://hhs.texas.gov/",
  UT: "https://medicaid.utah.gov/",
  VT: "https://portal.healthconnect.vermont.gov/VTHBELand/welcome.action",
  VA: "https://www.dmas.virginia.gov/",
  WA: "https://www.hca.wa.gov/",
  WV: "https://dhhr.wv.gov/",
  WI: "https://www.dhs.wisconsin.gov/",
  WY: "https://health.wyo.gov/",
};

const STATE_WIC_URLS: Record<StateAbbr, string> = {
  AL: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_state%3A289&f%5B1%5D=fns_contact_related_programs%3A32",
  AK: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_state%3A288&f%5B1%5D=fns_contact_related_programs%3A32",
  AZ: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A287",
  AR: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A278",
  CA: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A286",
  CO: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A266",
  CT: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A285",
  DE: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A291",
  DC: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A290",
  FL: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A265",
  GA: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A308",
  HI: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A303",
  ID: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A268",
  IL: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A264",
  IN: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A302",
  IA: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A294",
  KS: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A284",
  KY: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A301",
  LA: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A300",
  ME: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A263",
  MD: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A304",
  MA: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A299",
  MI: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A283",
  MN: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A298",
  MS: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A297",
  MO: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A311",
  MT: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A262",
  NE: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A258",
  NV: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A269",
  NH: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A281",
  NJ: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A279",
  NM: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A307",
  NY: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A261",
  NC: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A260",
  ND: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A270",
  OH: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A276",
  OK: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A271",
  OR: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A296",
  PA: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A273",
  RI: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A293",
  SC: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A259",
  SD: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A292",
  TN: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A306",
  TX: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A309",
  UT: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A274",
  VT: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A275",
  VA: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A267",
  WA: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A310",
  WV: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A272",
  WI: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A282",
  WY: "https://www.fns.usda.gov/fns-contacts?sort_bef_combine=title_fulltext_ASC&f%5B0%5D=fns_contact_related_programs%3A32&f%5B1%5D=fns_contact_state%3A305",
};

const STATE_HEALTH_DEPT_URLS: Record<StateAbbr, string> = {
  AL: "https://www.alabamapublichealth.gov/",
  AK: "https://health.alaska.gov/Pages/default.aspx",
  AZ: "https://www.azdhs.gov/",
  AR: "https://www.healthy.arkansas.gov/",
  CA: "https://www.cdph.ca.gov/",
  CO: "https://cdphe.colorado.gov/",
  CT: "https://portal.ct.gov/dph",
  DE: "https://www.dhss.delaware.gov/dhss/",
  DC: "https://dchealth.dc.gov/",
  FL: "https://www.floridahealth.gov/",
  GA: "https://dph.georgia.gov/",
  HI: "https://health.hawaii.gov/",
  ID: "https://healthandwelfare.idaho.gov/",
  IL: "https://dph.illinois.gov/",
  IN: "https://www.in.gov/health/",
  IA: "https://hhs.iowa.gov/",
  KS: "https://www.kdhe.ks.gov/",
  KY: "https://www.chfs.ky.gov/agencies/dph/Pages/default.aspx",
  LA: "https://ldh.la.gov/",
  ME: "https://www.maine.gov/dhhs/programs-services/health-prevention-services",
  MD: "https://health.maryland.gov/pages/home.aspx",
  MA: "https://www.mass.gov/orgs/department-of-public-health",
  MI: "https://www.michigan.gov/mdhhs/keep-mi-healthy",
  MN: "https://www.health.state.mn.us/",
  MS: "https://msdh.ms.gov/",
  MO: "https://health.mo.gov/index.php",
  MT: "https://dphhs.mt.gov/publichealthinthe406",
  NE: "https://dhhs.ne.gov/Pages/public-health.aspx",
  NV: "https://dpbh.nv.gov/",
  NH: "https://www.dhhs.nh.gov/programs-services/health-care",
  NJ: "https://www.nj.gov/health/",
  NM: "https://www.nmhealth.org/",
  NY: "https://www.health.ny.gov/",
  NC: "https://www.ncdhhs.gov/",
  ND: "https://www.hhs.nd.gov/health",
  OH: "https://odh.ohio.gov/home",
  OK: "https://oklahoma.gov/health.html",
  OR: "https://www.oregon.gov/OHA/PH/Pages/index.aspx",
  PA: "https://www.health.pa.gov/Pages/default.aspx",
  RI: "https://health.ri.gov/",
  SC: "https://dph.sc.gov/",
  SD: "https://doh.sd.gov/",
  TN: "https://www.tn.gov/health.html",
  TX: "https://www.dshs.texas.gov/",
  UT: "https://dhhs.utah.gov/",
  VT: "https://www.healthvermont.gov/",
  VA: "https://www.vdh.virginia.gov/",
  WA: "https://doh.wa.gov/",
  WV: "https://dhhr.wv.gov/Pages/default.aspx",
  WI: "https://www.dhs.wisconsin.gov/",
  WY: "https://health.wyo.gov/",
};

const STATE_RIGHTS_PROFILE: Record<
  StateAbbr,
  {
    pregnancyDiscrimination: ProtectionScope;
    pregnancyAccommodation: ProtectionScope;
    lactationProtection: ProtectionScope;
  }
> = {
  AL: { pregnancyDiscrimination: "federal_only", pregnancyAccommodation: "limited_scope", lactationProtection: "federal_only" },
  AK: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "limited_scope", lactationProtection: "federal_only" },
  AZ: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "limited_scope", lactationProtection: "federal_only" },
  AR: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "limited_scope", lactationProtection: "statewide_or_broad" },
  CA: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  CO: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  CT: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  DE: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  DC: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  FL: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "federal_only", lactationProtection: "federal_only" },
  GA: { pregnancyDiscrimination: "limited_scope", pregnancyAccommodation: "limited_scope", lactationProtection: "statewide_or_broad" },
  HI: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  ID: { pregnancyDiscrimination: "limited_scope", pregnancyAccommodation: "limited_scope", lactationProtection: "federal_only" },
  IL: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  IN: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "limited_scope" },
  IA: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "federal_only" },
  KS: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "federal_only" },
  KY: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  LA: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  ME: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  MD: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "federal_only" },
  MA: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  MI: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "limited_scope", lactationProtection: "federal_only" },
  MN: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  MS: { pregnancyDiscrimination: "federal_only", pregnancyAccommodation: "federal_only", lactationProtection: "statewide_or_broad" },
  MO: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  MT: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "limited_scope" },
  NE: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "limited_scope", lactationProtection: "statewide_or_broad" },
  NV: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  NH: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "federal_only" },
  NJ: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "limited_scope", lactationProtection: "statewide_or_broad" },
  NM: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  NY: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  NC: { pregnancyDiscrimination: "federal_only", pregnancyAccommodation: "limited_scope", lactationProtection: "statewide_or_broad" },
  ND: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "limited_scope", lactationProtection: "federal_only" },
  OH: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "limited_scope", lactationProtection: "federal_only" },
  OK: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "federal_only" },
  OR: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  PA: { pregnancyDiscrimination: "limited_scope", pregnancyAccommodation: "limited_scope", lactationProtection: "federal_only" },
  RI: { pregnancyDiscrimination: "limited_scope", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  SC: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  SD: { pregnancyDiscrimination: "federal_only", pregnancyAccommodation: "limited_scope", lactationProtection: "federal_only" },
  TN: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  TX: { pregnancyDiscrimination: "limited_scope", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "limited_scope" },
  UT: { pregnancyDiscrimination: "limited_scope", pregnancyAccommodation: "limited_scope", lactationProtection: "limited_scope" },
  VT: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  VA: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "limited_scope", lactationProtection: "statewide_or_broad" },
  WA: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "statewide_or_broad" },
  WV: { pregnancyDiscrimination: "limited_scope", pregnancyAccommodation: "limited_scope", lactationProtection: "federal_only" },
  WI: { pregnancyDiscrimination: "statewide_or_broad", pregnancyAccommodation: "statewide_or_broad", lactationProtection: "federal_only" },
  WY: { pregnancyDiscrimination: "limited_scope", pregnancyAccommodation: "federal_only", lactationProtection: "federal_only" },
};

const PFML_PROGRAM_URLS: Partial<Record<StateAbbr, string>> = {
  CA: "https://edd.ca.gov/en/disability/paid-family-leave/",
  CO: "https://famli.colorado.gov/",
  CT: "https://www.ctpaidleave.org/",
  DE: "https://labor.delaware.gov/delaware-paid-leave/",
  DC: "https://dcpaidfamilyleave.dc.gov/",
  MA: "https://www.mass.gov/paid-family-and-medical-leave-pfml",
  ME: "https://www.maine.gov/paidleave/",
  MD: "https://paidleave.maryland.gov/",
  MN: "https://paidleave.mn.gov/",
  NJ: "https://myleavebenefits.nj.gov/worker/",
  NY: "https://paidfamilyleave.ny.gov/",
  OR: "https://paidleave.oregon.gov/",
  RI: "https://dlt.ri.gov/individuals/temporary-disability-insurance-and-temporary-caregiver-insurance",
  WA: "https://paidleave.wa.gov/individuals-and-families/",
};

function rightsSummaryForState(abbr: StateAbbr): string[] {
  const stateName = STATE_NAMES[abbr];
  const profile = STATE_RIGHTS_PROFILE[abbr];

  const discriminationLine =
    profile.pregnancyDiscrimination === "statewide_or_broad"
      ? `${stateName} appears to have a state pregnancy-discrimination protection in addition to the federal baseline.`
      : profile.pregnancyDiscrimination === "limited_scope"
        ? `${stateName} appears to have some pregnancy-discrimination protections, but coverage may be limited by employer type or worker category.`
        : `${stateName} does not appear to add a separate state pregnancy-discrimination protection beyond federal law.`;

  const accommodationLine =
    profile.pregnancyAccommodation === "statewide_or_broad"
      ? `${stateName} appears to add state pregnancy-accommodation or pregnancy-leave rules beyond the federal baseline.`
      : profile.pregnancyAccommodation === "limited_scope"
        ? `${stateName} appears to have some pregnancy-accommodation rules, but they may be limited to certain public-sector or narrower worker groups.`
        : `${stateName} does not appear to add a separate statewide pregnancy-accommodation rule beyond federal law.`;

  const lactationLine =
    profile.lactationProtection === "statewide_or_broad"
      ? `${stateName} appears to add workplace lactation protections on top of the federal pumping-at-work baseline.`
      : profile.lactationProtection === "limited_scope"
        ? `${stateName} appears to have some workplace lactation protections, but the state coverage may be narrower than the federal baseline.`
        : `${stateName} mainly relies on federal pumping-at-work protections unless your employer offers more.`;

  const commonNeedsLine =
    abbr === "AR" || abbr === "WI"
      ? `People in ${stateName} often need help confirming postpartum Medicaid timing, renewal steps, and what coverage lasts beyond birth.`
      : PFML_ACTIVE_STATES.has(abbr)
        ? `People in ${stateName} often need help coordinating state paid leave claims with employer paperwork and job-protection rules.`
        : PFML_ENACTED_STATES.has(abbr)
          ? `People in ${stateName} often need help understanding when the new paid leave program starts and what to use before benefits begin.`
          : `People in ${stateName} often need help comparing employer leave, short-term disability, unpaid FMLA leave, and public-benefit coverage.`;

  return [
    `Federal protection: Workers in ${stateName} may still have job-protected unpaid leave through FMLA if they meet the employer-size and hours-worked requirements.`,
    discriminationLine,
    accommodationLine,
    lactationLine,
    commonNeedsLine,
  ];
}

function trustedSupportLinksForState(abbr: StateAbbr): TrustedLink[] {
  const stateName = STATE_NAMES[abbr];
  const links: TrustedLink[] = [
    {
      label: `${stateName} Medicaid agency`,
      url: STATE_MEDICAID_URLS[abbr],
    },
    {
      label: `${stateName} WIC contacts`,
      url: STATE_WIC_URLS[abbr],
    },
    {
      label: `${stateName} Department of Health`,
      url: STATE_HEALTH_DEPT_URLS[abbr],
    },
  ];

  const paidLeaveUrl = PFML_PROGRAM_URLS[abbr];
  if (paidLeaveUrl) {
    links.push({
      label: `${stateName} paid leave program`,
      url: paidLeaveUrl,
    });
  }

  return links;
}

function immediateHelpForState(abbr: StateAbbr): ImmediateHelpItem[] {
  return [
    { label: "Emergency", contact: "911" },
    {
      label: "Crisis support",
      contact: "988",
      url: "https://988lifeline.org/",
    },
    {
      label: "Local help and referrals",
      contact: "211",
      url: "https://www.211.org/",
    },
  ];
}

export const STATE_DATA: Record<StateAbbr, StateSnapshot> = (
  Object.entries(STATE_NAMES) as [StateAbbr, string][]
).reduce(
  (acc, [abbr, name]) => {
    acc[abbr] = {
      abbr,
      name,
      postpartumCoverage:
        abbr === "DC"
          ? { summary: "12 months postpartum coverage (Medicaid)" }
          : postpartumSummaryForState(abbr),
      paidFamilyLeave: pfmlSummary(abbr),
      rightsSummary: rightsSummaryForState(abbr),
      trustedSupportLinks: trustedSupportLinksForState(abbr),
      immediateHelp: immediateHelpForState(abbr),
    };
    return acc;
  },
  {} as Record<StateAbbr, StateSnapshot>,
);
