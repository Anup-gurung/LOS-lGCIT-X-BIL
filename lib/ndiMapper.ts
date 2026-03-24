// lib/ndiMapper.ts
import {
  mapNdiDataToPersonalDetail,
  mapNdiDataToCoBorrower,
  mapNdiDataToRepaymentGuarantor,
  mapNdiDataToSecurityGuarantor,
} from "@/lib/mapNdiData";

export const mapNDIDataByRole = (
  role: string,
  step: string | null,
  ndiAttributes: any
) => {
  if (role === "applicant") {
    return {
      key: "verifiedCustomerData",
      data: mapNdiDataToPersonalDetail(ndiAttributes),
    };
  }

  if (role === "co-applicant") {
    return {
      key: "verifiedCoborrowerData",
      data: mapNdiDataToCoBorrower(ndiAttributes),
    };
  }

  if (role === "guarantor") {
    if (step === "3") {
      return {
        key: "verifiedSecurityData",
        data: mapNdiDataToSecurityGuarantor(ndiAttributes),
      };
    }

    if (step === "4") {
      return {
        key: "verifiedRepaymentData",
        data: mapNdiDataToRepaymentGuarantor(ndiAttributes),
      };
    }
  }

  // fallback
  return {
    key: "verifiedCustomerData",
    data: mapNdiDataToPersonalDetail(ndiAttributes),
  };
};