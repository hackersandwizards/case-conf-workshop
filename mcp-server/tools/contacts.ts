import { apiClient } from "../api-client.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const contactTools: Tool[] = [
  {
    name: "contacts_list",
    description: "List contacts with pagination and optional owner filter",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "JWT access token for authentication",
        },
        skip: {
          type: "number",
          description: "Number of records to skip for pagination (default: 0)",
        },
        limit: {
          type: "number",
          description: "Maximum number of records to return (max 100, default: 100)",
        },
      },
      required: ["token"],
    },
  },
  {
    name: "contacts_create",
    description: "Create a new contact",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "JWT access token for authentication",
        },
        organisation: {
          type: "string",
          description: "Organisation name (max 255 characters)",
        },
        description: {
          type: "string",
          description: "Contact description",
        },
      },
      required: ["token", "organisation"],
    },
  },
  {
    name: "contacts_get",
    description: "Get a contact by ID",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "JWT access token for authentication",
        },
        contactId: {
          type: "string",
          description: "Contact ID",
        },
      },
      required: ["token", "contactId"],
    },
  },
  {
    name: "contacts_update",
    description: "Update a contact by ID",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "JWT access token for authentication",
        },
        contactId: {
          type: "string",
          description: "Contact ID",
        },
        organisation: {
          type: "string",
          description: "Organisation name (max 255 characters)",
        },
        description: {
          type: "string",
          description: "Contact description",
        },
      },
      required: ["token", "contactId"],
    },
  },
  {
    name: "contacts_delete",
    description: "Delete a contact by ID",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "JWT access token for authentication",
        },
        contactId: {
          type: "string",
          description: "Contact ID",
        },
      },
      required: ["token", "contactId"],
    },
  },
];

export async function handleContactTool(name: string, args: Record<string, unknown>) {
  const token = args.token as string;

  switch (name) {
    case "contacts_list": {
      const skip = args.skip as number | undefined;
      const limit = args.limit as number | undefined;

      try {
        const response = await apiClient.listContacts(token, skip, limit);
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
                { error: error instanceof Error ? error.message : "Failed to list contacts" },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }

    case "contacts_create": {
      const { organisation, description } = args as {
        organisation: string;
        description?: string;
      };

      try {
        const contact = await apiClient.createContact(token, {
          organisation,
          description,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(contact, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { error: error instanceof Error ? error.message : "Failed to create contact" },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }

    case "contacts_get": {
      const { contactId } = args as { contactId: string };

      try {
        const contact = await apiClient.getContact(token, contactId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(contact, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { error: error instanceof Error ? error.message : "Contact not found" },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }

    case "contacts_update": {
      const { contactId, organisation, description } = args as {
        contactId: string;
        organisation?: string;
        description?: string;
      };

      try {
        const contact = await apiClient.updateContact(token, contactId, {
          organisation,
          description,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(contact, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { error: error instanceof Error ? error.message : "Failed to update contact" },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }

    case "contacts_delete": {
      const { contactId } = args as { contactId: string };

      try {
        const result = await apiClient.deleteContact(token, contactId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { error: error instanceof Error ? error.message : "Failed to delete contact" },
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
      throw new Error(`Unknown contact tool: ${name}`);
  }
}
