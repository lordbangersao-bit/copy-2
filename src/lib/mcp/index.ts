import { defineMcp } from "@lovable.dev/mcp-js";
import consultaAgenteTool from "./tools/consulta-agente";

export default defineMcp({
  name: "dmen-gestor-mcp",
  title: "DMEN Gestor MCP",
  version: "0.1.0",
  instructions:
    "Ferramentas do DMEN Gestor (Educação — Namacunde). Use `consulta_agente` para consultar publicamente os dados de um agente fornecendo o número de agente, BI e chave única.",
  tools: [consultaAgenteTool],
});
