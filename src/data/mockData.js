export const INITIAL_TENDER = {
  id: "GEM/2026/B/892101",
  title: "Supply, Configuration & 3-Yr Support of 500 Enterprise Laptops",
  authority: "Ministry of Electronics & Information Technology (MeitY)",
  category: "Computer Equipment / IT Infrastructure",
  estimatedBudget: 60000000, // ₹60 Lakhs
  currencySymbol: "₹",
  minLocalContentRequired: 50, // 50% for Class-I Local Supplier
  bidSubmissionEnd: "15 Mar 2026, 18:00 IST",
  evaluationDate: "08 Sep 2026",
  officerInCharge: "Devendra Verma, Jt. Dir (Procurement)",
};

export const INITIAL_BIDDERS = [
  {
    id: "BID-8921-01",
    name: "NexaTech Computations Pvt Ltd",
    legalName: "NexaTech Computations India Private Limited",
    quoteAmount: 5240000, // ₹52,40,000
    pan: "AABCN4920K",
    panStatus: "Verified",
    gstin: "07AABCN4920K1Z8",
    gstStatus: "Active",
    udyam: "UDYAM-DL-01-0089241",
    msmeType: "Medium Enterprise",
    localContentPct: 68,
    localClass: "Class-I Local Supplier",
    aiScore: 96,
    status: "Qualified",
    debarmentStatus: "Clear (0 Incidents)",
    financialTurnover: "₹18.4 Cr (Avg 3 Yrs)",
    experienceYears: 8,
    submittedDocsCount: 14,
    oemAuthorization: "Valid (HP Enterprise Gold Partner)",
    isoCertified: true,
    lastAudited: "Today, 10:14 AM",
    officerRemarks: "All statutory GST, PAN, and MII declarations cross-verified with MCA21 & GeM API. Passed technical evaluation.",
    auditHistory: [
      { timestamp: "08 Sep 2026, 10:14 AM", action: "AI Pre-qualification Passed", actor: "Bidly Automated Engine" },
      { timestamp: "08 Sep 2026, 10:30 AM", action: "Officer Preliminary Approval", actor: "Devendra Verma" }
    ],
    flags: [],
    extractedJson: {
      bidder_id: "BID-8921-01",
      legal_entity: "NexaTech Computations India Private Limited",
      cin_number: "U72200DL2018PTC334512",
      pan: "AABCN4920K",
      gstin: "07AABCN4920K1Z8",
      gst_filing_frequency: "Monthly (GSTR-3B filed up to Aug 2026)",
      mii_declaration: {
        local_value_addition_percentage: 68.4,
        factory_location: "Plot 42, Sector 58, Noida, Uttar Pradesh",
        auditor_ca_membership: "ICAI-509123"
      },
      oem_auth_code: "HPE-IND-AUTH-2026-9912",
      bid_security_declaration: "Exempted via Valid MSME Udyam"
    }
  },
  {
    id: "BID-8921-02",
    name: "Apex CyberSystems India",
    legalName: "Apex CyberSystems & Infra Solutions Ltd",
    quoteAmount: 4980000, // ₹49,80,000 (Will be L1 among qualified)
    pan: "AAACA5812B",
    panStatus: "Verified",
    gstin: "27AAACA5812B1ZX",
    gstStatus: "Active",
    udyam: "UDYAM-MH-03-0044192",
    msmeType: "Small Enterprise",
    localContentPct: 62,
    localClass: "Class-I Local Supplier",
    aiScore: 94,
    status: "Qualified",
    debarmentStatus: "Clear (0 Incidents)",
    financialTurnover: "₹14.2 Cr (Avg 3 Yrs)",
    experienceYears: 6,
    submittedDocsCount: 16,
    oemAuthorization: "Valid (Dell Technologies Tier-1)",
    isoCertified: true,
    lastAudited: "Today, 11:05 AM",
    officerRemarks: "Lowest compliant quotation verified with Class-I Make in India certificate.",
    auditHistory: [
      { timestamp: "08 Sep 2026, 11:00 AM", action: "AI Pre-qualification Passed", actor: "Bidly Automated Engine" }
    ],
    flags: [],
    extractedJson: {
      bidder_id: "BID-8921-02",
      legal_entity: "Apex CyberSystems & Infra Solutions Ltd",
      cin_number: "L72900MH2016PLC288410",
      pan: "AAACA5812B",
      gstin: "27AAACA5812B1ZX",
      gst_filing_frequency: "Monthly (GSTR-3B active)",
      mii_declaration: {
        local_value_addition_percentage: 62.0,
        factory_location: "Electronic City, Phase 1, Bangalore & Pune Hub",
        auditor_ca_membership: "ICAI-094124"
      },
      oem_auth_code: "DELL-GOV-IND-2026-880",
      bid_security_declaration: "EMD Bank Guarantee ₹1,20,000 Submitted"
    }
  },
  {
    id: "BID-8921-03",
    name: "Falcon Infotech LLP",
    legalName: "Falcon Infotech Logistics & Solutions LLP",
    quoteAmount: 4450000, // ₹44,50,000 (Low quoted, but FRAUD / PAN Mismatch)
    pan: "AAACF1294K",
    panStatus: "Mismatch Flagged",
    gstin: "07AABCF9876E1Z5", // PAN in GST does not match PAN declared
    gstStatus: "Suspended / Inactive",
    udyam: "UDYAM-DL-02-0099182",
    msmeType: "Micro Enterprise",
    localContentPct: 54,
    localClass: "Class-I Local Supplier",
    aiScore: 24,
    status: "Disqualified",
    debarmentStatus: "Flagged (1 Incident in Coal India 2025)",
    financialTurnover: "₹1.1 Cr (Below ₹3 Cr Criterion)",
    experienceYears: 2,
    submittedDocsCount: 8,
    oemAuthorization: "Invalid / Forged Watermark Detected",
    isoCertified: false,
    lastAudited: "Today, 09:22 AM",
    officerRemarks: "Critical mismatch: Bidder PAN does not match GSTIN digits 3 to 12. GST portal shows suspended registration. Debarred in Coal India 2025.",
    auditHistory: [
      { timestamp: "08 Sep 2026, 09:22 AM", action: "AI Severe Red Flags Triggered", actor: "Bidly Fraud Detection" },
      { timestamp: "08 Sep 2026, 09:40 AM", action: "Auto-Disqualified & Sent to Vigilance", actor: "Devendra Verma" }
    ],
    flags: [
      { severity: "critical", title: "PAN-GSTIN Digits Mismatch", description: "PAN submitted is AAACF1294K but GSTIN carries AABCF9876E. Suspected front-entity." },
      { severity: "critical", title: "GST Registration Suspended", description: "CBIC API returned status SUSPENDED due to non-filing of GSTR-1 for 6 months." },
      { severity: "high", title: "GeM Debarment Watchlist Hit", description: "Listed on watchlist for non-delivery under Tender GEM/2025/B/4102." }
    ],
    extractedJson: {
      bidder_id: "BID-8921-03",
      legal_entity: "Falcon Infotech Logistics & Solutions LLP",
      llpin: "AAA-9981",
      pan: "AAACF1294K",
      gstin: "07AABCF9876E1Z5",
      gst_filing_frequency: "Defaulted (Last filed: Jan 2026)",
      mii_declaration: {
        local_value_addition_percentage: 54.0,
        factory_location: "Okhla Industrial Area Ph-III, New Delhi",
        auditor_ca_membership: "Unverified / Non-existent"
      },
      oem_auth_code: "FORGERY_DETECTED_LEN_099",
      bid_security_declaration: "Invalid EMD Instrument"
    }
  },
  {
    id: "BID-8921-04",
    name: "Global Tech Imports Ltd",
    legalName: "Global Tech & Electronics Imports Limited",
    quoteAmount: 4720000, // ₹47,20,000
    pan: "AAACG4410R",
    panStatus: "Verified",
    gstin: "29AAACG4410R1Z2",
    gstStatus: "Active",
    udyam: "UDYAM-KR-03-0012984",
    msmeType: "Large Corporate",
    localContentPct: 26, // Below 50%
    localClass: "Class-II / Non-Local Supplier",
    aiScore: 42,
    status: "Disqualified",
    debarmentStatus: "Clear (0 Incidents)",
    financialTurnover: "₹45.0 Cr",
    experienceYears: 12,
    submittedDocsCount: 15,
    oemAuthorization: "Valid (Lenovo Direct Import)",
    isoCertified: true,
    lastAudited: "Today, 11:30 AM",
    officerRemarks: "Failed mandatory Class-I Make in India threshold (Achieved 26% vs required >=50%). Tender reserved for Class-I suppliers.",
    auditHistory: [
      { timestamp: "08 Sep 2026, 11:30 AM", action: "Failed MII Local Content Criteria", actor: "Bidly Automated Engine" }
    ],
    flags: [
      { severity: "critical", title: "MII Local Content Violation", description: "Declared local content is 26%, which is below the mandatory 50% threshold for Class-I preference." }
    ],
    extractedJson: {
      bidder_id: "BID-8921-04",
      legal_entity: "Global Tech & Electronics Imports Limited",
      cin_number: "L31900KA2012PLC066541",
      pan: "AAACG4410R",
      gstin: "29AAACG4410R1Z2",
      gst_filing_frequency: "Monthly (Regular)",
      mii_declaration: {
        local_value_addition_percentage: 26.0,
        factory_location: "Direct Import via Nhava Sheva Port, BOM",
        auditor_ca_membership: "ICAI-881203"
      },
      oem_auth_code: "LEN-DIR-2026-0041",
      bid_security_declaration: "EMD ₹1,20,000 Paid via RTGS"
    }
  },
  {
    id: "BID-8921-05",
    name: "Vanguard IT Solutions",
    legalName: "Vanguard IT & Networking Solutions Pvt Ltd",
    quoteAmount: 5120000,
    pan: "AABCV7788P",
    panStatus: "Verified",
    gstin: "33AABCV7788P1Z9",
    gstStatus: "Active",
    udyam: "UDYAM-TN-01-0077123",
    msmeType: "Small Enterprise",
    localContentPct: 58,
    localClass: "Class-I Local Supplier",
    aiScore: 91,
    status: "Qualified",
    debarmentStatus: "Clear (0 Incidents)",
    financialTurnover: "₹9.8 Cr",
    experienceYears: 5,
    submittedDocsCount: 14,
    oemAuthorization: "Valid (Acer India Certified)",
    isoCertified: true,
    lastAudited: "Today, 11:45 AM",
    officerRemarks: "Technically qualified. MII and financial audits verified.",
    auditHistory: [
      { timestamp: "08 Sep 2026, 11:45 AM", action: "AI Verified & Passed", actor: "Bidly Automated Engine" }
    ],
    flags: [],
    extractedJson: {
      bidder_id: "BID-8921-05",
      legal_entity: "Vanguard IT & Networking Solutions Pvt Ltd",
      cin_number: "U72900TN2019PTC129481",
      pan: "AABCV7788P",
      gstin: "33AABCV7788P1Z9",
      gst_filing_frequency: "Monthly",
      mii_declaration: {
        local_value_addition_percentage: 58.2,
        factory_location: "SIPCOT IT Park, Siruseri, Chennai",
        auditor_ca_membership: "ICAI-401923"
      },
      oem_auth_code: "ACER-GOLD-TN-2026",
      bid_security_declaration: "MSME Exemption"
    }
  },
  {
    id: "BID-8921-06",
    name: "Sahyadri Infotech Hub",
    legalName: "Sahyadri Infotech Hub Private Limited",
    quoteAmount: 5390000,
    pan: "AABCS3311E",
    panStatus: "Verified",
    gstin: "27AABCS3311E1Z3",
    gstStatus: "Active",
    udyam: "UDYAM-MH-19-0091238",
    msmeType: "Micro Enterprise",
    localContentPct: 52,
    localClass: "Class-I Local Supplier",
    aiScore: 88,
    status: "Qualified",
    debarmentStatus: "Clear (0 Incidents)",
    financialTurnover: "₹6.5 Cr",
    experienceYears: 4,
    submittedDocsCount: 13,
    oemAuthorization: "Valid (HP Partner)",
    isoCertified: true,
    lastAudited: "Yesterday",
    officerRemarks: "Qualified with minor note on past experience timelines.",
    auditHistory: [],
    flags: [],
    extractedJson: {
      bidder_id: "BID-8921-06",
      legal_entity: "Sahyadri Infotech Hub Private Limited",
      pan: "AABCS3311E",
      gstin: "27AABCS3311E1Z3",
      mii_declaration: { local_value_addition_percentage: 52.0 }
    }
  },
  {
    id: "BID-8921-07",
    name: "Paramount Data Systems",
    legalName: "Paramount Data & Computing Services Ltd",
    quoteAmount: 5480000,
    pan: "AAACP9901M",
    panStatus: "Verified",
    gstin: "06AAACP9901M1Z1",
    gstStatus: "Active",
    udyam: "UDYAM-HR-04-0019284",
    msmeType: "Medium Enterprise",
    localContentPct: 65,
    localClass: "Class-I Local Supplier",
    aiScore: 92,
    status: "Qualified",
    debarmentStatus: "Clear (0 Incidents)",
    financialTurnover: "₹22.1 Cr",
    experienceYears: 10,
    submittedDocsCount: 17,
    oemAuthorization: "Valid (Dell OEM)",
    isoCertified: true,
    lastAudited: "Yesterday",
    officerRemarks: "Strong compliance score, all documents verified.",
    auditHistory: [],
    flags: [],
    extractedJson: {
      bidder_id: "BID-8921-07",
      legal_entity: "Paramount Data & Computing Services Ltd",
      pan: "AAACP9901M",
      gstin: "06AAACP9901M1Z1",
      mii_declaration: { local_value_addition_percentage: 65.0 }
    }
  },
  {
    id: "BID-8921-08",
    name: "Zenith Digital Infra",
    legalName: "Zenith Digital Infrastructure LLP",
    quoteAmount: 5590000,
    pan: "AAACZ6671N",
    panStatus: "Verified",
    gstin: "24AAACZ6671N1ZA",
    gstStatus: "Active",
    udyam: "UDYAM-GJ-01-0066120",
    msmeType: "Small Enterprise",
    localContentPct: 60,
    localClass: "Class-I Local Supplier",
    aiScore: 89,
    status: "Qualified",
    debarmentStatus: "Clear (0 Incidents)",
    financialTurnover: "₹11.0 Cr",
    experienceYears: 6,
    submittedDocsCount: 15,
    oemAuthorization: "Valid (Lenovo Tier-1)",
    isoCertified: true,
    lastAudited: "Yesterday",
    officerRemarks: "Fully verified.",
    auditHistory: [],
    flags: [],
    extractedJson: {
      bidder_id: "BID-8921-08",
      legal_entity: "Zenith Digital Infrastructure LLP",
      pan: "AAACZ6671N",
      gstin: "24AAACZ6671N1ZA",
      mii_declaration: { local_value_addition_percentage: 60.0 }
    }
  },
  {
    id: "BID-8921-09",
    name: "Krystal Byte Informatics",
    legalName: "Krystal Byte Informatics Private Limited",
    quoteAmount: 5650000,
    pan: "AABCK4829T",
    panStatus: "Verified",
    gstin: "36AABCK4829T1ZY",
    gstStatus: "Active",
    udyam: "UDYAM-TS-09-0012399",
    msmeType: "Small Enterprise",
    localContentPct: 55,
    localClass: "Class-I Local Supplier",
    aiScore: 87,
    status: "Qualified",
    debarmentStatus: "Clear (0 Incidents)",
    financialTurnover: "₹8.4 Cr",
    experienceYears: 5,
    submittedDocsCount: 13,
    oemAuthorization: "Valid (HP Partner)",
    isoCertified: true,
    lastAudited: "Yesterday",
    officerRemarks: "Compliant in all respects.",
    auditHistory: [],
    flags: [],
    extractedJson: {
      bidder_id: "BID-8921-09",
      legal_entity: "Krystal Byte Informatics Private Limited",
      pan: "AABCK4829T",
      gstin: "36AABCK4829T1ZY",
      mii_declaration: { local_value_addition_percentage: 55.0 }
    }
  },
  {
    id: "BID-8921-10",
    name: "CyberShield Technologies",
    legalName: "CyberShield Security & Technologies Ltd",
    quoteAmount: 5720000,
    pan: "AAACC1120Q",
    panStatus: "Verified",
    gstin: "07AAACC1120Q1Z4",
    gstStatus: "Active",
    udyam: "UDYAM-DL-03-0044129",
    msmeType: "Medium Enterprise",
    localContentPct: 70,
    localClass: "Class-I Local Supplier",
    aiScore: 95,
    status: "Qualified",
    debarmentStatus: "Clear (0 Incidents)",
    financialTurnover: "₹29.0 Cr",
    experienceYears: 11,
    submittedDocsCount: 18,
    oemAuthorization: "Valid (Dell Partner)",
    isoCertified: true,
    lastAudited: "Yesterday",
    officerRemarks: "All statutory checks green.",
    auditHistory: [],
    flags: [],
    extractedJson: {
      bidder_id: "BID-8921-10",
      legal_entity: "CyberShield Security & Technologies Ltd",
      pan: "AAACC1120Q",
      gstin: "07AAACC1120Q1Z4",
      mii_declaration: { local_value_addition_percentage: 70.0 }
    }
  },
  {
    id: "BID-8921-11",
    name: "BlueStar Hardware & Systems",
    legalName: "BlueStar Hardware & Systems LLP",
    quoteAmount: 4890000,
    pan: "AAACB9921D",
    panStatus: "Verified",
    gstin: "19AAACB9921D1ZB",
    gstStatus: "Active",
    udyam: "UDYAM-WB-10-0081249",
    msmeType: "Micro Enterprise",
    localContentPct: 51,
    localClass: "Class-I Local Supplier",
    aiScore: 78,
    status: "Action Required",
    debarmentStatus: "Under Clarification",
    financialTurnover: "₹3.8 Cr (Marginal vs ₹3.0 Cr req)",
    experienceYears: 3,
    submittedDocsCount: 11,
    oemAuthorization: "Clarification Requested (OEM Endorsement date expired)",
    isoCertified: false,
    lastAudited: "Today, 08:30 AM",
    officerRemarks: "OEM authorization endorsement certificate expired on 31 Dec 2025. Clarification letter issued under GeM Rule 173.",
    auditHistory: [
      { timestamp: "08 Sep 2026, 08:30 AM", action: "Clarification Issued for OEM Certificate", actor: "Devendra Verma" }
    ],
    flags: [
      { severity: "medium", title: "OEM Auth Certificate Expiry", description: "Authorization letter from OEM bears validity till 31/12/2025. Bidder requested to provide extended undertaking within 48 hours." }
    ],
    extractedJson: {
      bidder_id: "BID-8921-11",
      legal_entity: "BlueStar Hardware & Systems LLP",
      pan: "AAACB9921D",
      gstin: "19AAACB9921D1ZB",
      mii_declaration: { local_value_addition_percentage: 51.0 },
      oem_auth_expiry: "2025-12-31 (EXPIRED)"
    }
  },
  {
    id: "BID-8921-12",
    name: "QuickSilver Network Solutions",
    legalName: "QuickSilver Network Solutions India Pvt Ltd",
    quoteAmount: 5850000,
    pan: "AABCQ8811K",
    panStatus: "Verified",
    gstin: "32AABCQ8811K1Z2",
    gstStatus: "Active",
    udyam: "UDYAM-KL-07-0099441",
    msmeType: "Small Enterprise",
    localContentPct: 18, // Severe Non-Local
    localClass: "Non-Local Supplier (<20%)",
    aiScore: 35,
    status: "Disqualified",
    debarmentStatus: "Clear (0 Incidents)",
    financialTurnover: "₹7.1 Cr",
    experienceYears: 4,
    submittedDocsCount: 10,
    oemAuthorization: "Valid",
    isoCertified: false,
    lastAudited: "Yesterday",
    officerRemarks: "Non-Local Supplier (<20% Make in India). Direct violation of Class-I procurement mandate.",
    auditHistory: [],
    flags: [
      { severity: "critical", title: "Non-Local Supplier Category", description: "Declared local content is only 18%. Ineligible for Class-I preference tender." }
    ],
    extractedJson: {
      bidder_id: "BID-8921-12",
      legal_entity: "QuickSilver Network Solutions India Pvt Ltd",
      pan: "AABCQ8811K",
      gstin: "32AABCQ8811K1Z2",
      mii_declaration: { local_value_addition_percentage: 18.0 }
    }
  }
];

// Preset verification cases for Screen 2 (Lab)
export const PRESET_VERIFICATION_CASES = {
  compliant: {
    title: "Compliant Bidder Dossier (NexaTech Systems)",
    fileName: "Dossier_NexaTech_GEM8921_TechBid_Signed.pdf",
    fileSize: "14.2 MB",
    fileHash: "sha256:8f419c8d32b5093e...",
    bidderName: "NexaTech Computations India Private Limited",
    pan: "AABCN4920K",
    gstin: "07AABCN4920K1Z8",
    udyam: "UDYAM-DL-01-0089241",
    localContentPct: 68.4,
    localContentClass: "Class-I Local Supplier (>=50%)",
    turnover: "₹18.4 Cr (Avg 3 Yrs)",
    oemAuth: "Valid HPE Gold Partner (Exp: 2027)",
    aiScore: 96,
    riskLevel: "Low Risk (Compliant)",
    deductions: [
      { score: -4, category: "Documentation", reason: "Minor: ISO 27001 renewal due within 60 days (Still currently valid)" }
    ],
    positiveHighlights: [
      { title: "Statutory Identity Match", detail: "PAN and GSTIN 100% verified active on MCA21 & GST Portal." },
      { title: "Class-I Local Content Certified", detail: "68.4% domestic value addition certified by ICAI practicing CA (M.No: 509123)." },
      { title: "Clean Central Vigilance Track", detail: "0 negative remarks across GeM, CPPP, and CPWD debarment repositories." }
    ],
    mlPrediction: {
      predicted_compliance_label: "Compliant",
      confidence: 0.7626,
      compliance_risk_score: 12.01,
      risk_level: "LOW",
      probabilities: { "Compliant": 0.7626, "Needs Review": 0.2347, "Non-Compliant": 0.0027 },
      individual_model_probabilities: {
        logistic_regression: { "Compliant": 0.9103, "Needs Review": 0.0897, "Non-Compliant": 0.0 },
        lightgbm: { "Compliant": 0.6025, "Needs Review": 0.3919, "Non-Compliant": 0.0056 }
      },
      fusion_weights: { "logistic_regression": 0.52, "lightgbm": 0.48 },
      decision_support_summary: "AI Decision Support: Flagged as 'Compliant' (Confidence: 76.3%, Risk Score: 12.01/100). Final procurement qualification rests with the Officer."
    },
    featureProvenance: {
      seller_experience_years: { value: 6.0, source: "PLATFORM" },
      seller_turnover_inr: { value: 184000000.0, source: "DOCUMENT" },
      bid_value_inr: { value: 5240000.0, source: "PLATFORM" },
      experience_certificate: { value: 1.0, source: "DOCUMENT" },
      technical_compliance_score: { value: 96.0, source: "DERIVED" },
      document_completeness_pct: { value: 100.0, source: "DERIVED" },
      price_deviation_pct: { value: -91.27, source: "DERIVED" },
      delivery_days: { value: 30.0, source: "UNAVAILABLE" },
      past_contracts_count: { value: 10.0, source: "UNAVAILABLE" },
      complaints_count: { value: 0.0, source: "UNAVAILABLE" },
      ocr_required: { value: 0.0, source: "DERIVED" },
      category: { value: "Laptops", source: "PLATFORM" },
      gst_status: { value: "Active", source: "DERIVED" },
      pan_status: { value: "Verified", source: "DERIVED" },
      msme_status: { value: "Medium", source: "DOCUMENT" },
      oem_authorization: { value: "Valid", source: "DOCUMENT" },
      turnover_certificate: { value: "Verified", source: "DOCUMENT" },
      document_verification_status: { value: "Verified", source: "DERIVED" },
      gst_name_match: { value: "Match", source: "MOCK_EXTERNAL" },
      gst_registration_state_match: { value: "Match", source: "MOCK_EXTERNAL" },
      gst_return_filing_status: { value: "Regular", source: "MOCK_EXTERNAL" }
    },
    rawJson: {
      meta: {
        document_type: "GeM Technical Bid Dossier v4.2",
        digital_signature: "VALID (Devendra S., CA-Cert Class-3)",
        timestamp_utc: "2026-09-08T04:44:12Z",
        parsed_pages: 42
      },
      bidder_identity: {
        legal_name: "NexaTech Computations India Private Limited",
        cin: "U72200DL2018PTC334512",
        pan: "AABCN4920K",
        pan_status: "VERIFIED_ACTIVE",
        gstin: "07AABCN4920K1Z8",
        gstin_status: "ACTIVE_REGULAR",
        udyam_registration: "UDYAM-DL-01-0089241"
      },
      financial_profile: {
        fy_2023_24_turnover: "₹16.8 Cr",
        fy_2024_25_turnover: "₹19.2 Cr",
        fy_2025_26_turnover: "₹19.2 Cr",
        net_worth_positive: true,
        solvency_cert_issued_by: "State Bank of India (₹5.0 Cr Limit)"
      },
      statutory_compliance: {
        make_in_india_percentage: 68.4,
        mii_category: "Class-I Local Supplier",
        factory_address: "Plot 42, Sector 58, Noida, Gautam Buddha Nagar, UP-201301",
        debarment_record_gem: "NONE",
        debarment_record_cppp: "NONE",
        oem_authorization: "HPE-IND-AUTH-2026-9912 (VERIFIED)"
      }
    }
  },

  fraud: {
    title: "Fraud Dossier: PAN Mismatch & Suspended GST (Falcon Infotech)",
    fileName: "Dossier_Falcon_TechBid_GEM_Suspicious.pdf",
    fileSize: "8.7 MB",
    fileHash: "sha256:d19001ba90c8812a...",
    bidderName: "Falcon Infotech Logistics & Solutions LLP",
    pan: "AAACF1294K",
    gstin: "07AABCF9876E1Z5",
    udyam: "UDYAM-DL-02-0099182",
    localContentPct: 54.0,
    localContentClass: "Class-I Claimed (Unverified)",
    turnover: "₹1.1 Cr (Below ₹3 Cr Threshold)",
    oemAuth: "Forged Watermark Detected",
    aiScore: 24,
    riskLevel: "Critical Risk (Fraud Flags)",
    deductions: [
      { score: -40, category: "Statutory Fraud", reason: "Critical: PAN 'AAACF1294K' does not match GSTIN digits 3-12 ('AABCF9876E')" },
      { score: -20, category: "Tax Compliance", reason: "GST Registration is SUSPENDED by CBIC due to GSTR-1 defaults" },
      { score: -10, category: "Financial Criteria", reason: "Average 3-yr turnover is ₹1.1 Cr, failing minimum tender criteria of ₹3.0 Cr" },
      { score: -6, category: "OEM Certificate", reason: "OEM authorization certificate failed cryptographic watermark validation" }
    ],
    positiveHighlights: [],
    mlPrediction: {
      predicted_compliance_label: "Non-Compliant",
      confidence: 0.984,
      compliance_risk_score: 98.4,
      risk_level: "HIGH",
      probabilities: { "Compliant": 0.001, "Needs Review": 0.015, "Non-Compliant": 0.984 },
      individual_model_probabilities: {
        logistic_regression: { "Compliant": 0.0, "Needs Review": 0.02, "Non-Compliant": 0.98 },
        lightgbm: { "Compliant": 0.002, "Needs Review": 0.01, "Non-Compliant": 0.988 }
      },
      fusion_weights: { "logistic_regression": 0.52, "lightgbm": 0.48 },
      decision_support_summary: "AI Decision Support: Flagged as 'Non-Compliant' (Confidence: 98.4%, Risk Score: 98.4/100). Critical PAN-GST identity mismatch."
    },
    featureProvenance: {
      seller_experience_years: { value: 2.0, source: "PLATFORM" },
      seller_turnover_inr: { value: 11000000.0, source: "DOCUMENT" },
      bid_value_inr: { value: 4450000.0, source: "PLATFORM" },
      experience_certificate: { value: 0.0, source: "DERIVED" },
      technical_compliance_score: { value: 24.0, source: "DERIVED" },
      document_completeness_pct: { value: 57.1, source: "DERIVED" },
      price_deviation_pct: { value: -92.58, source: "DERIVED" },
      delivery_days: { value: 30.0, source: "UNAVAILABLE" },
      past_contracts_count: { value: 10.0, source: "UNAVAILABLE" },
      complaints_count: { value: 0.0, source: "UNAVAILABLE" },
      ocr_required: { value: 0.0, source: "DERIVED" },
      category: { value: "Laptops", source: "PLATFORM" },
      gst_status: { value: "Suspended", source: "DERIVED" },
      pan_status: { value: "Mismatch Flagged", source: "DERIVED" },
      msme_status: { value: "Medium", source: "DOCUMENT" },
      oem_authorization: { value: "Missing", source: "DERIVED" },
      turnover_certificate: { value: "Verified", source: "DOCUMENT" },
      document_verification_status: { value: "Mismatch", source: "DERIVED" },
      gst_name_match: { value: "Mismatch", source: "DERIVED" },
      gst_registration_state_match: { value: "Match", source: "MOCK_EXTERNAL" },
      gst_return_filing_status: { value: "Not Filed", source: "MOCK_EXTERNAL" }
    },
    rawJson: {
      meta: {
        document_type: "GeM Technical Bid Dossier v4.2",
        digital_signature: "WARNING: Self-signed certificate mismatch",
        timestamp_utc: "2026-09-08T03:52:10Z",
        parsed_pages: 18
      },
      bidder_identity: {
        legal_name: "Falcon Infotech Logistics & Solutions LLP",
        llpin: "AAA-9981",
        pan_declared: "AAACF1294K",
        gstin_declared: "07AABCF9876E1Z5",
        gstin_pan_embedded: "AABCF9876E",
        integrity_check: "FAILED_MISMATCH",
        gstin_portal_status: "SUSPENDED_DEFAULT"
      },
      fraud_analytics: {
        identity_anomaly: "Entity using different corporate PAN for GST registration",
        gem_blacklist_hit: "Incident INC-2025-COAL-0912 (Debarred for 12 months)",
        oem_validation_error: "OEM Partner Portal returned 'NO RECORD' for auth code LEN_099"
      },
      statutory_compliance: {
        make_in_india_percentage: 54.0,
        factory_address: "Okhla Ph-III, New Delhi (Shared Virtual Office)",
        auditor_udinn: "INVALID_CA_REGISTRATION"
      }
    }
  },

  low_content: {
    title: "Low Local Content Dossier (Global Tech Imports)",
    fileName: "Dossier_GlobalTech_DirectImport_Specs.pdf",
    fileSize: "21.5 MB",
    fileHash: "sha256:77bc09e114092b1a...",
    bidderName: "Global Tech & Electronics Imports Limited",
    pan: "AAACG4410R",
    gstin: "29AAACG4410R1Z2",
    udyam: "UDYAM-KR-03-0012984",
    localContentPct: 26.0,
    localContentClass: "Class-II / Non-Local (Ineligible for Class-I reserved bid)",
    turnover: "₹45.0 Cr",
    oemAuth: "Valid Direct Import OEM Certificate",
    aiScore: 42,
    riskLevel: "High Risk (Mandate Non-Compliance)",
    deductions: [
      { score: -50, category: "Make in India Policy", reason: "Mandatory Class-I Local Content requirement is >=50%. Bidder declared only 26% (Direct Port Import)" },
      { score: -8, category: "Tender Clause 4.1", reason: "Tender is exclusively reserved for Class-I Local Suppliers as per DPIIT order P-45021/2/2017-PP" }
    ],
    positiveHighlights: [
      { title: "Statutory Tax & Financial Soundness", detail: "PAN and GSTIN are 100% active, turnover exceeds ₹45 Cr with positive net worth." },
      { title: "Valid Direct OEM Auth", detail: "Direct OEM authorization certificate cryptographically signed by Lenovo." }
    ],
    mlPrediction: {
      predicted_compliance_label: "Needs Review",
      confidence: 0.742,
      compliance_risk_score: 48.5,
      risk_level: "MEDIUM",
      probabilities: { "Compliant": 0.183, "Needs Review": 0.742, "Non-Compliant": 0.075 },
      individual_model_probabilities: {
        logistic_regression: { "Compliant": 0.15, "Needs Review": 0.78, "Non-Compliant": 0.07 },
        lightgbm: { "Compliant": 0.22, "Needs Review": 0.70, "Non-Compliant": 0.08 }
      },
      fusion_weights: { "logistic_regression": 0.52, "lightgbm": 0.48 },
      decision_support_summary: "AI Decision Support: Flagged as 'Needs Review' (Confidence: 74.2%, Risk Score: 48.5/100). Local content declaration below Class-I threshold."
    },
    featureProvenance: {
      seller_experience_years: { value: 7.0, source: "PLATFORM" },
      seller_turnover_inr: { value: 450000000.0, source: "DOCUMENT" },
      bid_value_inr: { value: 4720000.0, source: "PLATFORM" },
      experience_certificate: { value: 1.0, source: "DOCUMENT" },
      technical_compliance_score: { value: 42.0, source: "DERIVED" },
      document_completeness_pct: { value: 85.7, source: "DERIVED" },
      price_deviation_pct: { value: -92.13, source: "DERIVED" },
      delivery_days: { value: 30.0, source: "UNAVAILABLE" },
      past_contracts_count: { value: 12.0, source: "UNAVAILABLE" },
      complaints_count: { value: 0.0, source: "UNAVAILABLE" },
      ocr_required: { value: 0.0, source: "DERIVED" },
      category: { value: "Laptops", source: "PLATFORM" },
      gst_status: { value: "Active", source: "DERIVED" },
      pan_status: { value: "Verified", source: "DERIVED" },
      msme_status: { value: "Medium", source: "DOCUMENT" },
      oem_authorization: { value: "Valid", source: "DOCUMENT" },
      turnover_certificate: { value: "Verified", source: "DOCUMENT" },
      document_verification_status: { value: "Suspicious", source: "DERIVED" },
      gst_name_match: { value: "Match", source: "MOCK_EXTERNAL" },
      gst_registration_state_match: { value: "Match", source: "MOCK_EXTERNAL" },
      gst_return_filing_status: { value: "Regular", source: "MOCK_EXTERNAL" }
    },
    rawJson: {
      meta: {
        document_type: "GeM Technical Bid Dossier v4.2",
        digital_signature: "VALID",
        timestamp_utc: "2026-09-08T05:12:00Z",
        parsed_pages: 35
      },
      bidder_identity: {
        legal_name: "Global Tech & Electronics Imports Limited",
        cin: "L31900KA2012PLC066541",
        pan: "AAACG4410R",
        gstin: "29AAACG4410R1Z2",
        gstin_status: "ACTIVE_REGULAR"
      },
      make_in_india_details: {
        local_content_declared: 26.0,
        tender_minimum_threshold: 50.0,
        supplier_classification: "Non-Local / Class-II Supplier",
        import_bill_of_entry: "BOE-2026-BOM-881290",
        customs_duty_paid: true,
        eligibility_verdict: "INELIGIBLE_FOR_RESERVED_CLASS_I_TENDER"
      }
    }
  }
};
