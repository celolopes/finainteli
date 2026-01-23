import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { FinancialService } from "./financial";

const FS = FileSystem as any;

export const ExportService = {
  /**
   * Exporta transações para CSV
   */
  async exportTransactionsCSV(options?: { type?: "income" | "expense" }) {
    try {
      const transactions = await FinancialService.getTransactions(options);

      if (transactions.length === 0) {
        throw new Error("Nenhuma transação encontrada para exportar.");
      }

      // Cabeçalho do CSV
      let csvContent = "Data,Descrição,Categoria,Conta,Tipo,Valor,Moeda,Notas\n";

      // Linhas do CSV
      for (const t of transactions) {
        const date = new Date(t.transaction_date).toLocaleDateString("pt-BR");
        const description = (t.description || "").replace(/,/g, " ");
        const category = (t.category?.name || "Sem Categoria").replace(/,/g, " ");
        const account = (t.account?.name || "Sem Conta").replace(/,/g, " ");
        const type = t.type === "income" ? "Receita" : "Despesa";
        const amount = t.amount.toFixed(2);
        const currency = t.currency_code;
        const notes = (t.notes || "").replace(/,/g, " ").replace(/\n/g, " ");

        csvContent += `${date},${description},${category},${account},${type},${amount},${currency},${notes}\n`;
      }

      // Salva arquivo temporário
      const filename = `finainteli_transacoes_${new Date().getTime()}.csv`;
      const fileUri = `${FS.cacheDirectory}${filename}`;

      await FS.writeAsStringAsync(fileUri, csvContent, {
        encoding: FS.EncodingType.UTF8,
      });

      // Compartilha o arquivo
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Exportar Transações CSV",
          UTI: "public.comma-separated-values-text",
        });
      }

      return fileUri;
    } catch (error) {
      console.error("[ExportService] Erro ao exportar CSV:", error);
      throw error;
    }
  },

  /**
   * Exporta transações para PDF
   */
  async exportTransactionsPDF(options?: { type?: "income" | "expense" }) {
    try {
      const transactions = await FinancialService.getTransactions(options);

      if (transactions.length === 0) {
        throw new Error("Nenhuma transação encontrada para exportar.");
      }

      const total = transactions.reduce((acc, t) => {
        return t.type === "income" ? acc + t.amount : acc - t.amount;
      }, 0);

      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .income { color: green; }
              .expense { color: red; }
              .total { margin-top: 20px; font-size: 18px; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Relatório de Transações</h1>
            <p>Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
            
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                ${transactions
                  .map((t) => {
                    const date = new Date(t.transaction_date).toLocaleDateString("pt-BR");
                    const typeLabel = t.type === "income" ? "Receita" : "Despesa";
                    const typeClass = t.type === "income" ? "income" : "expense";
                    const amount = t.amount.toFixed(2);
                    return `
                    <tr>
                      <td>${date}</td>
                      <td>${t.description}</td>
                      <td>${t.category?.name || "-"}</td>
                      <td class="${typeClass}">${typeLabel}</td>
                      <td>R$ ${amount}</td>
                    </tr>
                  `;
                  })
                  .join("")}
              </tbody>
            </table>

            <div class="total">
              Saldo Total do Período: R$ ${total.toFixed(2)}
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Exportar Relatório PDF",
          UTI: "com.adobe.pdf",
        });
      }

      return uri;
    } catch (error) {
      console.error("[ExportService] Erro ao exportar PDF:", error);
      throw error;
    }
  },
};
