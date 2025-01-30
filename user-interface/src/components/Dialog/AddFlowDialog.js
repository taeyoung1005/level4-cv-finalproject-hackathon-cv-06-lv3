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
} from "@chakra-ui/react";

function AddFlowDialog({ isOpen, onClose, onAdd }) {
  const [flowName, setFlowName] = useState("");

  const handleAdd = () => {
    if (flowName.trim()) {
      onAdd({ name: flowName });
      setFlowName("");
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add New Flow</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <Input
              placeholder="Flow Name"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
            />
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="teal" mr={3} onClick={handleAdd}>
            Add Flow
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default AddFlowDialog;
