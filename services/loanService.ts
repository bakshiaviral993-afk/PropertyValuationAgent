/**
 * QuantCasa Loan Approval Engine
 * Pure client-side simulation—migrated from backend for speed. No cloud deps.
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

  if (isNaN(incomeMonthly) || incomeMonthly <= 0) throw new Error("Invalid monthly income.");
  if (isNaN(existingEMI) || existingEMI < 0) throw new Error("Invalid existing EMI.");
  if (isNaN(creditScore) || creditScore < 300 || creditScore > 900) throw new Error("Invalid credit score.");

  let ltvMultiplier = creditScore > 760 ? 0.85 : creditScore > 700 ? 0.80 : 0.75;
  if (employmentType === "self-employed") ltvMultiplier *= 0.90;

  const maxLoanByProperty = propertyValue * ltvMultiplier;
  const foirRatio = creditScore > 750 ? 0.60 : 0.50;
  const maxEMI = (incomeMonthly * foirRatio) - existingEMI;
  const interestRate = 0.085 / 12;
  const tenureMonths = 240;
  const estimatedEMI = requestedAmount * interestRate * Math.pow(1 + interestRate, tenureMonths) / 
                       (Math.pow(1 + interestRate, tenureMonths) - 1);

  let decision: LoanApprovalResult['decision'] = "Rejected";
  const reasons: string[] = [];

  if (creditScore < 620) reasons.push("Credit score below minimum threshold (620)");
  if (estimatedEMI > maxEMI) reasons.push(`EMI (₹${Math.round(estimatedEMI)}) exceeds monthly capacity (₹${Math.round(maxEMI)})`);
  if (requestedAmount > maxLoanByProperty) reasons.push(`Amount exceeds safe LTV limit (₹${Math.round(maxLoanByProperty)})`);

  if (reasons.length === 0) decision = "Approved";
  else if (reasons.length === 1 && creditScore > 680) decision = "Conditional";

  return {
    decision,
    maxLoanAmount: Math.floor(maxLoanByProperty),
    safeEMI: Math.floor(maxEMI),
    approvalProbability: decision === "Approved" ? 0.92 : decision === "Conditional" ? 0.55 : 0.12,
    reasons,
    timestamp: Date.now()
  };
};