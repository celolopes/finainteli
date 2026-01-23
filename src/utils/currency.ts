export const CurrencyUtils = {
  // Formata um valor numérico bruto para o formato da moeda (Display)
  // Ex: 1234.56 -> "R$ 1.234,56" (BRL)
  format: (value: number, currency: string = "BRL") => {
    return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
      style: "currency",
      currency: currency,
    }).format(value);
  },

  // Máscara de entrada: Recebe string digitada ("1234"), converte para valor visual ("12,34")
  maskInput: (text: string, currency: string = "BRL") => {
    // 1. Remove tudo que não é dígito
    const cleanFn = (t: string) => t.replace(/\D/g, "");
    const cleanValue = cleanFn(text);

    // 2. Converte para número (centavos)
    const numberValue = parseInt(cleanValue, 10) / 100;

    if (isNaN(numberValue)) return "";

    // 3. Formata usando Intl, mas remove o símbolo da moeda se quisermos só o número formatado no input
    // (Geralmente inputs com Affix "R$" pedem apenas o número "1.234,56")
    const formatted = new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numberValue);

    return formatted;
  },

  // Converte o valor formatado do input ("1.234,56") de volta para float (1234.56) para salvar
  parse: (text: string, currency: string = "BRL") => {
    if (!text) return 0;

    // Remove tudo exceto dígitos, pontuação decimal e separador de milhar
    // BRL: 1.234,56 -> remove pontos, troca vírgula por ponto
    if (currency === "BRL") {
      const clean = text.replace(/\./g, "").replace(",", ".");
      return parseFloat(clean);
    }

    // USD: 1,234.56 -> remove vírgulas
    const clean = text.replace(/,/g, "");
    return parseFloat(clean);
  },

  getSymbol: (currency: string) => {
    return (0)
      .toLocaleString(currency === "BRL" ? "pt-BR" : "en-US", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 })
      .replace(/\d/g, "")
      .trim();
  },
};
