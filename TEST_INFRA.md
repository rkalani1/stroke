# E2E Test Infra: Stroke CDS Application

## Test Philosophy
- Opaque-box, requirement-driven. Derived from ORIGINAL_REQUEST.md and clinical specifications without dependency on internal implementation design.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Testing.

## Feature Inventory
| # | Feature | Source (Requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|----------------------|:------:|:------:|:------:|
| 1 | 2026 AHA/ASA AIS Guidelines | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | SVIN 2025 Large-Core EVT | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 3 | CATALYST 2025 DOAC Timing | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 4 | Large-Core Decision Trees | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 5 | Blood Pressure Guardrails | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 6 | Pediatric Reperfusion Pathway | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 7 | Guideline Library Catalog | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 8 | 32 Education Modules | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 9 | Minimized Accordion Structure | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 10 | Dark Mode & Contrast Compliance | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 11 | 2024-2026 Trial Citations | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 12 | Content Bundling Pipeline | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 13 | Content & Currency Validator | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 14 | Evidence & Matcher Validator | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 15 | Citation & Inline Citation Validators | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 16 | Playwright Protocol Snapshot Lock | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 17 | Institutional & PHI Leak Guard | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 18 | Production Build & Compression | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 19 | Git Deployment Verification | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Acute Wake-Up Stroke with Large Core (ASPECTS 4, 18h) | F1, F2, F4, F5, F14 | High |
| 2 | Acute Ischemic Stroke with AFib on Apixaban + Early DOAC Restart | F1, F3, F5, F7, F8, F11 | High |
| 3 | Adolescent Acute LVO Reperfusion (Age 14y, M1 occlusion) | F1, F6, F7, F16 | High |
| 4 | Spontaneous Deep ICH with Acute SBP Surge | F5, F7, F8, F16 | High |
| 5 | Education Reference Traversal & Dark-Mode Accordion Accessibility | F8, F9, F10, F11, F13 | Medium |

## Coverage Thresholds
- Tier 1: >=5 per feature (>=95 cases)
- Tier 2: >=5 per feature (>=95 cases)
- Tier 3: Pairwise coverage of major feature interactions (>=19 cases)
- Tier 4: >=5 realistic clinical application scenarios
- Total Target: >=214 E2E test cases
