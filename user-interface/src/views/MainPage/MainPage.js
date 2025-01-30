import React from "react";
import { Box, Flex, Text, Button } from "@chakra-ui/react";
import { Link } from "react-router-dom";

function MainPage() {
  return (
    <Flex
      direction="column"
      pt={{ base: "120px", md: "75px" }}
      px={4}
      w="100%"
      align="center"
    >
      <Text fontSize="2xl" fontWeight="bold" mb={6}>
        Welcome to My App
      </Text>
      <Flex gap={6} flexWrap="wrap" justify="center">
        <Box
          w={{ base: "100%", md: "40%" }}
          p={6}
          bg="linear-gradient(127.09deg, #1e1f26 19.41%, #27293d 76.65%)"
          borderRadius="20px"
          textAlign="center"
          cursor="pointer"
          as={Link}
          to="/auth/about"
          _hover={{ bg: "gray.700" }}
        >
          <Text color="#fff" fontSize="lg" fontWeight="bold" mb={4}>
            About Us
          </Text>
          <Text color="gray.400" fontSize="sm">
            Learn more about our team.
          </Text>
        </Box>
        <Box
          w={{ base: "100%", md: "40%" }}
          p={6}
          bg="linear-gradient(127.09deg, #1e1f26 19.41%, #27293d 76.65%)"
          borderRadius="20px"
          textAlign="center"
          cursor="pointer"
          as={Link}
          to="/admin/dashboard"
          _hover={{ bg: "gray.700" }}
        >
          <Text color="#fff" fontSize="lg" fontWeight="bold" mb={4}>
            Projects
          </Text>
          <Text color="gray.400" fontSize="sm">
            Manage and explore your projects.
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
}

export default MainPage;
