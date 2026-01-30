import { database } from "..";
import AIUsageLog from "../model/AIUsageLog";

export const AIUsageRepository = {
  async saveLog(data: { userId: string; modelId: string; promptTokens: number; candidatesTokens: number; totalTokens: number; costBrl: number; featureName: string }) {
    try {
      await database.write(async () => {
        await database.get<AIUsageLog>("ai_usage_logs").create((log) => {
          log.userId = data.userId;
          log.modelId = data.modelId;
          log.promptTokens = data.promptTokens;
          log.candidatesTokens = data.candidatesTokens;
          log.totalTokens = data.totalTokens;
          log.costBrl = data.costBrl;
          log.featureName = data.featureName;
        });
      });
    } catch (error) {
      console.error("Error saving AI usage log:", error);
    }
  },

  async getAllLogs() {
    return await database.get<AIUsageLog>("ai_usage_logs").query().fetch();
  },

  async getFeatureBreakdown() {
    const logs = await this.getAllLogs();
    const breakdown: Record<string, { totalTokens: number; totalCost: number }> = {};

    logs.forEach((log) => {
      if (!breakdown[log.featureName]) {
        breakdown[log.featureName] = { totalTokens: 0, totalCost: 0 };
      }
      breakdown[log.featureName].totalTokens += log.totalTokens;
      breakdown[log.featureName].totalCost += log.costBrl;
    });

    return breakdown;
  },
};
