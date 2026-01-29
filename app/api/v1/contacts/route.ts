import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse, parseQueryParams } from "@/lib/api-utils";

// GET /api/v1/contacts - List contacts
export async function GET(request: NextRequest) {
  try {
    const result = await requireAuth(request);
    if ("error" in result) {
      return result.error;
    }

    const { skip, limit, search } = parseQueryParams(request);
    const trimmedSearch = search.trim();

    // Superusers see all contacts, regular users see only their own
    const ownerFilter = result.user.isSuperuser
      ? {}
      : { ownerId: result.user.id };

    // Add search filter if provided (SQLite's LIKE is case-insensitive by default)
    const whereClause = trimmedSearch
      ? {
          ...ownerFilter,
          OR: [
            { organisation: { contains: trimmedSearch } },
            { description: { contains: trimmedSearch } },
          ],
        }
      : ownerFilter;

    const [contacts, count] = await Promise.all([
      prisma.contact.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      }),
      prisma.contact.count({ where: whereClause }),
    ]);

    return successResponse({
      data: contacts,
      count,
    });
  } catch (error) {
    console.error("List contacts error:", error);
    return errorResponse(500, "Internal server error");
  }
}

// POST /api/v1/contacts - Create a new contact
export async function POST(request: NextRequest) {
  try {
    const result = await requireAuth(request);
    if ("error" in result) {
      return result.error;
    }

    const body = await request.json();
    const { organisation, description } = body;

    if (!organisation) {
      return errorResponse(400, "Organisation is required");
    }

    if (organisation.length > 255) {
      return errorResponse(400, "Organisation must be at most 255 characters");
    }

    const contact = await prisma.contact.create({
      data: {
        organisation,
        description: description || null,
        ownerId: result.user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return successResponse(contact, 201);
  } catch (error) {
    console.error("Create contact error:", error);
    return errorResponse(500, "Internal server error");
  }
}
