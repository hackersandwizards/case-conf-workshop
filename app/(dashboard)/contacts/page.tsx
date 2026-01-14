"use client";

import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Menu,
  Portal,
  Skeleton,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";
import { ContactsApi, type Contact } from "@/lib/client/api";
import { AddContactDialog } from "@/components/contacts/AddContactDialog";
import { EditContactDialog } from "@/components/contacts/EditContactDialog";
import { DeleteContactDialog } from "@/components/contacts/DeleteContactDialog";

const PAGE_SIZE = 5;
const FETCH_LIMIT = 1000; // Fetch more contacts for client-side filtering

export default function ContactsPage() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [deleteContact, setDeleteContact] = useState<Contact | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => ContactsApi.list(0, FETCH_LIMIT),
  });

  const allContacts = useMemo(() => data?.data || [], [data?.data]);

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return allContacts;
    const query = searchQuery.toLowerCase();
    return allContacts.filter(
      (contact) =>
        contact.organisation.toLowerCase().includes(query) ||
        (contact.description?.toLowerCase().includes(query) ?? false)
    );
  }, [allContacts, searchQuery]);

  // Paginate filtered results
  const paginatedContacts = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredContacts.slice(start, start + PAGE_SIZE);
  }, [filteredContacts, page]);

  const totalCount = filteredContacts.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Reset to first page when search changes
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setPage(0);
  }, []);

  return (
    <Box>
      <Stack gap={6}>
        <Flex justify="space-between" align="center">
          <Heading size="xl">Contacts</Heading>
          <Flex gap={3} align="center">
            <Box position="relative" width="250px">
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={handleSearchChange}
                size="sm"
                bg="white"
                pr={searchQuery ? "32px" : undefined}
              />
              {searchQuery && (
                <Button
                  size="xs"
                  variant="ghost"
                  position="absolute"
                  right="4px"
                  top="50%"
                  transform="translateY(-50%)"
                  onClick={clearSearch}
                  minW="auto"
                  h="auto"
                  p={1}
                >
                  ✕
                </Button>
              )}
            </Box>
            <AddContactDialog />
          </Flex>
        </Flex>

        <Box bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Organisation</Table.ColumnHeader>
                <Table.ColumnHeader>Description</Table.ColumnHeader>
                <Table.ColumnHeader width="100px">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <Table.Row key={i}>
                    <Table.Cell>
                      <Skeleton height="20px" />
                    </Table.Cell>
                    <Table.Cell>
                      <Skeleton height="20px" />
                    </Table.Cell>
                    <Table.Cell>
                      <Skeleton height="20px" />
                    </Table.Cell>
                  </Table.Row>
                ))
              ) : paginatedContacts.length === 0 && searchQuery ? (
                <Table.Row>
                  <Table.Cell colSpan={3}>
                    <Text textAlign="center" color="gray.500" py={4}>
                      No contacts match &quot;{searchQuery}&quot;
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : paginatedContacts.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={3}>
                    <Text textAlign="center" color="gray.500" py={4}>
                      No contacts yet. Add your first contact!
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                paginatedContacts.map((contact) => (
                  <Table.Row key={contact.id}>
                    <Table.Cell fontWeight="medium">
                      {contact.organisation}
                    </Table.Cell>
                    <Table.Cell color="gray.600">
                      {contact.description || "-"}
                    </Table.Cell>
                    <Table.Cell>
                      <Menu.Root>
                        <Menu.Trigger asChild>
                          <Button size="sm" variant="ghost">
                            •••
                          </Button>
                        </Menu.Trigger>
                        <Portal>
                          <Menu.Positioner>
                            <Menu.Content>
                              <Menu.Item
                                value="edit"
                                onClick={() => setEditContact(contact)}
                              >
                                Edit
                              </Menu.Item>
                              <Menu.Item
                                value="delete"
                                color="red.500"
                                onClick={() => setDeleteContact(contact)}
                              >
                                Delete
                              </Menu.Item>
                            </Menu.Content>
                          </Menu.Positioner>
                        </Portal>
                      </Menu.Root>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>

          {totalPages > 1 && (
            <Flex justify="center" p={4} gap={2}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Text alignSelf="center" color="gray.600">
                Page {page + 1} of {totalPages}
              </Text>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </Flex>
          )}
        </Box>
      </Stack>

      {editContact && (
        <EditContactDialog
          contact={editContact}
          open={!!editContact}
          onOpenChange={(open) => !open && setEditContact(null)}
        />
      )}

      {deleteContact && (
        <DeleteContactDialog
          contact={deleteContact}
          open={!!deleteContact}
          onOpenChange={(open) => !open && setDeleteContact(null)}
        />
      )}
    </Box>
  );
}
