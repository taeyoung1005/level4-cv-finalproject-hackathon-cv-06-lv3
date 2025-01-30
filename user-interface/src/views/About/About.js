import React from "react";
import { Box, Text, Flex } from "@chakra-ui/react";

function About() {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      pt={{ base: "120px", md: "75px" }}
      px={4}
    >
      <Box maxW="800px" textAlign="center">
        <Text fontSize="2xl" fontWeight="bold" mb={4}>
          About Us
        </Text>
        <Text color="gray.400">
          Welcome to our app! We are a team dedicated to optimizing your
          projects and making your workflow seamless.
        </Text>
      </Box>
    </Flex>
  );
}

export default About;
