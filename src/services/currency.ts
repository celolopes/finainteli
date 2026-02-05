export const CurrencyService = {
  /**
   * Fetches the current USD to BRL exchange rate.
   * Uses AwesomeAPI with a fallback to ExchangeRate-API.
   */
  async getUsdBrlRate(): Promise<number> {
    try {
      console.log("[CurrencyService] Fetching USD/BRL rate...");

      // Primary API: AwesomeAPI (Direct USD-BRL)
      const response = await fetch("https://economia.awesomeapi.com.br/last/USD-BRL?t=" + Date.now());
      const data = await response.json();

      if (data && data.USDBRL) {
        const rate = parseFloat(data.USDBRL.bid);
        console.log("[CurrencyService] AwesomeAPI rate fetched:", rate);
        return rate;
      }

      // Secondary API Fallback: ExchangeRate-API (General rates)
      console.log("[CurrencyService] AwesomeAPI failed or unexpected format, trying fallback API...");
      const fallbackResponse = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      const fallbackData = await fallbackResponse.json();

      if (fallbackData && fallbackData.rates && fallbackData.rates.BRL) {
        const fallbackRate = fallbackData.rates.BRL;
        console.log("[CurrencyService] Fallback API rate fetched:", fallbackRate);
        return fallbackRate;
      }

      console.warn("[CurrencyService] All APIs failed, using default 5.40");
      return 5.4;
    } catch (error) {
      console.error("[CurrencyService] Error fetching exchange rate:", error);
      return 5.4;
    }
  },
};
