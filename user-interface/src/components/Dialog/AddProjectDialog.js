import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  VStack,
  Flex,
} from "@chakra-ui/react";
import { Separator } from "components/Separator/Separator";

function AddProjectDialog({ isOpen, onClose, onAdd }) {
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");

  const handleAdd = () => {
    if (newProjectName.trim() && newProjectDescription.trim()) {
      onAdd({ name: newProjectName, description: newProjectDescription });
      setNewProjectName("");
      setNewProjectDescription("");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent
        bg="linear-gradient(127.09deg, rgba(24, 29, 60, 0.94) 19.41%, rgba(10, 14, 35, 0.9) 76.65%)"
        borderRadius="15px"
      >
        <ModalHeader color="#fff">Add New Project</ModalHeader>
        <Separator />
        <ModalCloseButton color="#fff" />
        <ModalBody>
          <VStack spacing={4}>
            <Input
              placeholder="Project Name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              borderColor="gray.600"
              color="#fff"
              _placeholder={{ color: "gray.400" }}
            />
            <Textarea
              placeholder="Project Description"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              borderColor="gray.600"
              color="#fff"
              _placeholder={{ color: "gray.400" }}
            />
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Flex w="100%" justifyContent="flex-end">
            <Button onClick={onClose} mr={3} variant="ghost" color="white">
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              onClick={handleAdd}
              disabled={!newProjectName.trim() || !newProjectDescription.trim()}
            >
              Add
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default AddProjectDialog;
