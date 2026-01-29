import { authTools, handleAuthTool } from "./auth.js";
import { contactTools, handleContactTool } from "./contacts.js";

export const allTools = [...authTools, ...contactTools];

export async function handleToolCall(name: string, args: Record<string, unknown>) {
  if (name.startsWith("auth_")) {
    return handleAuthTool(name, args);
  }

  if (name.startsWith("contacts_")) {
    return handleContactTool(name, args);
  }

  throw new Error(`Unknown tool: ${name}`);
}
