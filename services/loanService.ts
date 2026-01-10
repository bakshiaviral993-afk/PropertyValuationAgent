/**
 * QuantCasa Loan Approval Engine
 * Migrated from backend node for high-speed local simulation.
 */

export interface LoanApprovalRequest {
  incomeMonthly: number;
  existingEMI: number;
  creditScore: number;
  propertyValue: number;
  requestedAmount: number;
  employmentType?: string;
}

export interface LoanApprovalResult {
  decision: "Approved" | "Conditional" | "Rejected";
  maxLoanAmount: number;
  safeEMI: number;
  approvalProbability: number;
  reasons: string[];
  timestamp: number;
}

export const calculateLoanApproval = async (args: LoanApprovalRequest): Promise<LoanApprovalResult> => {
  const { 
    incomeMonthly, 
    existingEMI, 
    creditScore, 
    propertyValue, 
    requestedAmount, 
    employmentType = "salaried" 
  } = args;

  // 1) LTV rule based on credit score and property type
  let ltvMultiplier = creditScore > 760 ? 0.8 : creditScore > 700 ? 0.75 : 0.65;
  
  // Risk Multipliers
  if (employmentType === "self-employed") ltvMultiplier -= 0.05;
  
  const maxLoanByProperty = propertyValue * ltvMultiplier;

  // 2) EMI affordability (DTI - Debt to Income)
  const dtiLimit = creditScore > 750 ? 0.50 : 0.45;
  const maxEMI = (incomeMonthly * dtiLimit) - existingEMI;
  
  // Approx EMI for 9% 20 yr (0.009 factor)
  const estimatedEMI = requestedAmount * 0.009; 

  // 3) Base decision logic
  let decision: "Approved" | "Conditional" | "Rejected" = "Rejected";
  let reasons: string[] = [];

  if (creditScore < 620) {
    reasons.push("Credit score falls below minimum lending threshold (620)");
  }
  
  if (estimatedEMI > maxEMI) {
    reasons.push(`Estimated EMI (₹${Math.round(estimatedEMI)}) exceeds your safe monthly capacity (₹${Math.round(maxEMI)})`);
    reasons.push("Suggestion: Increase tenure or reduce requested loan amount");
  }
  
  if (requestedAmount > maxLoanByProperty) {
    reasons.push(`Requested amount exceeds the safe LTV (Loan-to-Value) limit for this asset (₹${Math.round(maxLoanByProperty)})`);
  }

  if (reasons.length === 0) {
    decision = "Approved";
  } else if (reasons.length === 1 && creditScore > 680) {
    decision = "Conditional";
  }

  return {
    decision,
    maxLoanAmount: Math.floor(maxLoanByProperty),
    safeEMI: Math.floor(maxEMI),
    approvalProbability: decision === "Approved" ? 0.92 : decision === "Conditional" ? 0.55 : 0.12,
    reasons,
    timestamp: Date.now()
  };
};
