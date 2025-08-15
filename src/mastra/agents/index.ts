// Simple authentication agent for risk assessment
export const authAgent = {
  name: 'Smart Authentication Agent',
  assessRisk: (email: string, userAgent?: string) => {
    let riskScore = 0;
    if (userAgent?.includes('Mobile')) riskScore += 20;
    if (email.includes('admin')) riskScore += 35;
    riskScore = Math.min(riskScore, 100);
    return {
      riskScore,
      requiresMFA: riskScore >= 50,
      reason: riskScore >= 50 ? `High risk score: ${riskScore}` : `Low risk score: ${riskScore}`
    };
  }
};
