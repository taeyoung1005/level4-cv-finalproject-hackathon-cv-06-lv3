import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Textarea,
} from "@chakra-ui/react";
import { Separator } from "components/Separator/Separator";

function EditProjectDialog({ isOpen, onClose, project, onUpdate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description);
    }
  }, [project]);

  const handleUpdate = () => {
    if (name.trim() && description.trim()) {
      onUpdate({ projectId: project.projectId, name, description });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        bg="linear-gradient(127.09deg, rgba(24, 29, 60, 0.94) 19.41%, rgba(10, 14, 35, 0.9) 76.65%)"
        borderRadius="15px"
      >
        <ModalHeader color="#FFF">Edit Project</ModalHeader>
        <Separator></Separator>
        <ModalCloseButton color="#fff" />
        <ModalBody>
          <Input
            placeholder="Project Name"
            value={name}
            color="#FFF"
            onChange={(e) => setName(e.target.value)}
            mb={4}
          />
          <Textarea
            placeholder="Project Description"
            value={description}
            color="#FFF"
            onChange={(e) => setDescription(e.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} mr={3}>
            Cancel
          </Button>
          <Button
            colorScheme="teal"
            onClick={handleUpdate}
            isDisabled={!name.trim() || !description.trim()}
          >
            Update
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default EditProjectDialog;
