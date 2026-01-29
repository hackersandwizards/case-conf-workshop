"use client";

import { Box, Heading, Text, Stack, Skeleton } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/client/useAuth";
import { ContactsApi } from "@/lib/client/api";

export default function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["contacts-count"],
    queryFn: () => ContactsApi.list(0, 1),
  });

  const contactsCount = data?.count ?? 0;

  return (
    <Box>
      <Stack gap={6}>
        <Box>
          <Heading size="xl">
            Welcome back{user?.fullName ? `, ${user.fullName}` : ""}!
          </Heading>
          <Text color="gray.600" mt={2}>
            Manage your contacts and settings from this dashboard.
          </Text>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
          <Heading size="md" mb={4}>
            Quick Stats
          </Heading>

          <Box
            bg="blue.50"
            p={4}
            borderRadius="md"
            borderLeft="4px solid"
            borderLeftColor="blue.500"
          >
            <Text color="gray.600" fontSize="sm" fontWeight="medium">
              Total Contacts
            </Text>
            {isLoading ? (
              <Skeleton height="36px" width="60px" mt={1} />
            ) : (
              <Text fontSize="3xl" fontWeight="bold" color="blue.600">
                {contactsCount}
              </Text>
            )}
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
