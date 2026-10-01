// 2026-09-30 intentional safety-contract changes: closed profiles are inactive;
// partial modeled matches require information/protocol confirmation. All other
// exclusions remain the prior source-reviewed expectations; not generated from engine output.
// Diagnostic-gate updates: documented ICH/TIA cannot satisfy AIS or lobar-ICH entry criteria.
export const EXPECTED_SNAPSHOT = {
  "empty form": {
    "step-evt": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "picasso": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "tested": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "verify": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "most": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "captiva": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "rhapsody": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "saturn": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "aspire": {
      "status": "needs_info",
      "exclusionsCount": 0
    }
  },
  "STEP-EVT MeVO": {
    "step-evt": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "picasso": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "tested": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "verify": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "most": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "captiva": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "rhapsody": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "saturn": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "aspire": {
      "status": "not_eligible",
      "exclusionsCount": 0
    }
  },
  "STEP-EVT low-NIHSS LVO": {
    "step-evt": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "picasso": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "tested": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "verify": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "most": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "captiva": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "rhapsody": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "saturn": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "aspire": {
      "status": "not_eligible",
      "exclusionsCount": 0
    }
  },
  "TESTED \u2014 pre-existing disability LVO": {
    "step-evt": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "picasso": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "tested": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "verify": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "most": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "captiva": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "rhapsody": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "saturn": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "aspire": {
      "status": "not_eligible",
      "exclusionsCount": 0
    }
  },
  "PICASSO \u2014 tandem": {
    "step-evt": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "picasso": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "tested": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "verify": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "most": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "captiva": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "rhapsody": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "saturn": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "aspire": {
      "status": "not_eligible",
      "exclusionsCount": 0
    }
  },
  "boundary \u2014 NIHSS = 6": {
    "step-evt": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "picasso": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "tested": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "verify": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "most": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "captiva": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "rhapsody": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "saturn": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "aspire": {
      "status": "not_eligible",
      "exclusionsCount": 0
    }
  },
  "late >24 h": {
    "step-evt": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "picasso": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "tested": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "verify": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "most": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "captiva": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "rhapsody": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "saturn": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "aspire": {
      "status": "not_eligible",
      "exclusionsCount": 0
    }
  },
  "ICH lobar on statin": {
    "step-evt": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "picasso": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "tested": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "verify": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "most": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "captiva": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "rhapsody": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "saturn": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "aspire": {
      "status": "needs_info",
      "exclusionsCount": 0
    }
  },
  "ICH + AF (ASPIRE)": {
    "step-evt": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "picasso": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "tested": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "verify": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "most": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "captiva": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "rhapsody": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "saturn": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "aspire": {
      "status": "needs_info",
      "exclusionsCount": 0
    }
  },
  "TIA + ICAS (CAPTIVA)": {
    "step-evt": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "picasso": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "tested": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "verify": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "most": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "captiva": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "rhapsody": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "saturn": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "aspire": {
      "status": "not_eligible",
      "exclusionsCount": 0
    }
  },
  "pediatric (age 12)": {
    "step-evt": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "picasso": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "tested": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "verify": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "most": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "captiva": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "rhapsody": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "saturn": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "aspire": {
      "status": "not_eligible",
      "exclusionsCount": 0
    }
  },
  "STEP-EVT eligible BUT pregnant": {
    "step-evt": {
      "status": "not_eligible",
      "exclusionsCount": 1
    },
    "picasso": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "tested": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "verify": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "most": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "captiva": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "rhapsody": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "saturn": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "aspire": {
      "status": "not_eligible",
      "exclusionsCount": 0
    }
  },
  "STEP-EVT eligible BUT hemorrhage on imaging": {
    "step-evt": {
      "status": "not_eligible",
      "exclusionsCount": 1
    },
    "picasso": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "tested": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "verify": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "most": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "captiva": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "rhapsody": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "saturn": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "aspire": {
      "status": "not_eligible",
      "exclusionsCount": 0
    }
  },
  "ASPIRE eligible BUT mechanical valve": {
    "step-evt": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "picasso": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "tested": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "verify": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "most": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "captiva": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "rhapsody": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "saturn": {
      "status": "needs_info",
      "exclusionsCount": 0
    },
    "aspire": {
      "status": "not_eligible",
      "exclusionsCount": 1
    }
  },
  "CAPTIVA eligible BUT cardioembolic": {
    "step-evt": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "picasso": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "tested": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "verify": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "most": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "captiva": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "rhapsody": {
      "status": "inactive",
      "exclusionsCount": 0
    },
    "saturn": {
      "status": "not_eligible",
      "exclusionsCount": 0
    },
    "aspire": {
      "status": "not_eligible",
      "exclusionsCount": 0
    }
  }
};
