import { login, verifyToken, getCurrentUser } from "../auth.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const authTools: Tool[] = [
  {
    name: "auth_login",
    description: "Authenticate a user and return a JWT access token",
    inputSchema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "User email address",
        },
        password: {
          type: "string",
          description: "User password",
        },
      },
      required: ["email", "password"],
    },
  },
  {
    name: "auth_verify_token",
    description: "Verify a JWT access token and return its payload",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "JWT access token to verify",
        },
      },
      required: ["token"],
    },
  },
  {
    name: "auth_get_current_user",
    description: "Get the current user information from a JWT token",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "JWT access token",
        },
      },
      required: ["token"],
    },
  },
];

export async function handleAuthTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "auth_login": {
      const { email, password } = args as { email: string; password: string };

      try {
        const response = await login(email, password);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { error: error instanceof Error ? error.message : "Login failed" },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }

    case "auth_verify_token": {
      const { token } = args as { token: string };

      try {
        const user = await verifyToken(token);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(user, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { error: error instanceof Error ? error.message : "Invalid or expired token" },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }

    case "auth_get_current_user": {
      const { token } = args as { token: string };

      try {
        const user = await getCurrentUser(token);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(user, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { error: error instanceof Error ? error.message : "Invalid token or user not found" },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }

    default:
      throw new Error(`Unknown auth tool: ${name}`);
  }
}
