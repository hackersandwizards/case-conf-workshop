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
import { useState } from "react";
import { ContactsApi, type Contact } from "@/lib/client/api";
import { AddContactDialog } from "@/components/contacts/AddContactDialog";
import { EditContactDialog } from "@/components/contacts/EditContactDialog";
import { DeleteContactDialog } from "@/components/contacts/DeleteContactDialog";
import { useDebounce } from "@/hooks/useDebounce";
import { useDeferredLoading } from "@/hooks/useDeferredLoading";

const PAGE_SIZE = 5;
const DEBOUNCE_DELAY = 300;
const LOADING_DELAY = 200;

export default function ContactsPage() {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [deleteContact, setDeleteContact] = useState<Contact | null>(null);

  const debouncedSearch = useDebounce(searchTerm, DEBOUNCE_DELAY);

  const { data, isLoading } = useQuery({
    queryKey: ["contacts", page, debouncedSearch],
    queryFn: () => ContactsApi.list(page * PAGE_SIZE, PAGE_SIZE, debouncedSearch),
  });

  const showLoading = useDeferredLoading(isLoading, LOADING_DELAY);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(0);
  };

  const contacts = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const getEmptyMessage = () => {
    if (debouncedSearch) {
      return `No contacts found matching "${debouncedSearch}"`;
    }
    return "No contacts yet. Add your first contact!";
  };

  return (
    <Box>
      <Stack gap={6}>
        <Flex justify="space-between" align="center">
          <Heading size="xl">Contacts</Heading>
          <AddContactDialog />
        </Flex>

        <Input
          placeholder="Search contacts by organisation or description..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          maxW="400px"
        />

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
              {showLoading ? (
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
              ) : contacts.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={3}>
                    <Text textAlign="center" color="gray.500" py={4}>
                      {getEmptyMessage()}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                contacts.map((contact) => (
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
