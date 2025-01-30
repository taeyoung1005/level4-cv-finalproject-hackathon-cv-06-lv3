import React, { useState, useEffect } from "react";
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
  VStack,
} from "@chakra-ui/react";

function EditFlowDialog({ isOpen, onClose, flow, onUpdate }) {
  const [flowName, setFlowName] = useState("");

  useEffect(() => {
    if (flow) {
      setFlowName(flow.flow_name || "");
    }
  }, [flow]);

  const handleUpdate = () => {
    if (flowName.trim()) {
      console.log("✅ Updating flow:", { flowId: flow.flowId, flowName });

      // ✅ 객체를 직접 렌더링하지 않도록 `onUpdate` 호출 시 주의!
      onUpdate(flow.flowId, flowName);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Flow</ModalHeader>
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
          <Button colorScheme="teal" mr={3} onClick={handleUpdate}>
            Update Flow
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default EditFlowDialog;
