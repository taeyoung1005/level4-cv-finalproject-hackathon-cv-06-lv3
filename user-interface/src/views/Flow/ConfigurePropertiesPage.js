import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useHistory } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Box,
  Flex,
  Grid,
  IconButton,
  Divider,
  Text,
  Button,
} from "@chakra-ui/react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import {
  fetchFlowProperties,
  updatePropertyCategory,
} from "store/features/flowSlice";

const ConfigurePropertiesPage = () => {
  const { projectId, flowId } = useParams();
  const dispatch = useDispatch();
  const history = useHistory();

  const flow = useSelector((state) => state.flows.flows[flowId] || {});
  const properties = useSelector(
    (state) =>
      state.flows.properties?.[flowId] || {
        numerical: [],
        categorical: [],
        unavailable: [],
      }
  );

  const [datasetProperties, setDatasetProperties] = useState({
    numerical: [],
    categorical: [],
    unavailable: [],
  });

  const [categorizedProperties, setCategorizedProperties] = useState({
    environmental: [],
    controllable: [],
    target: [],
  });

  useEffect(() => {
    dispatch(fetchFlowProperties(flowId));
  }, [dispatch, flowId]);

  useEffect(() => {
    setDatasetProperties({
      numerical: properties.numerical || [],
      categorical: properties.categorical || [],
      unavailable: properties.unavailable || [],
    });
  }, [properties]);

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceId = source.droppableId;
    const destId = destination.droppableId;

    let movedItem = null;

    if (datasetProperties[sourceId]) {
      const newSourceList = [...datasetProperties[sourceId]];
      movedItem = newSourceList.splice(source.index, 1)[0];

      setDatasetProperties((prev) => ({
        ...prev,
        [sourceId]: newSourceList,
      }));
    } else if (categorizedProperties[sourceId]) {
      const newSourceList = [...categorizedProperties[sourceId]];
      movedItem = newSourceList.splice(source.index, 1)[0];

      setCategorizedProperties((prev) => ({
        ...prev,
        [sourceId]: newSourceList,
      }));
    }

    if (!movedItem) return;

    if (categorizedProperties[destId]) {
      setCategorizedProperties((prev) => ({
        ...prev,
        [destId]: [...prev[destId], movedItem],
      }));
    } else {
      setDatasetProperties((prev) => ({
        ...prev,
        [destId]: [...prev[destId], movedItem],
      }));
    }

    dispatch(
      updatePropertyCategory({
        flowId,
        property: movedItem,
        category: destId,
      })
    );
  };

  const handleNextStep = () => {
    history.push(`/projects/${projectId}/flows/${flowId}/set-goals`);
  };

  return (
    <Flex flexDirection="column" pt={{ base: "120px", md: "75px" }}>
      <Flex justifyContent="space-between" alignItems="center" mb={6} px={6}>
        <Box>
          <Text fontSize="2xl" fontWeight="bold" color="white">
            Configure Properties
          </Text>
          <Text fontSize="md" color="gray.400">
            Drag and drop properties into appropriate categories.
          </Text>
        </Box>
        <Button
          rightIcon={<ArrowForwardIcon />}
          colorScheme="blue"
          onClick={handleNextStep}
        >
          Next Step
        </Button>
      </Flex>

      <DragDropContext
        onBeforeCapture={(start) => {
          const draggingElement = document.querySelector(
            `[data-rbd-drag-handle-draggable-id="${start.draggableId}"]`
          );
          if (draggingElement) {
            draggingElement.style.zIndex = "1000"; // ✅ 드래그 시작 시 최상단으로
          }
        }}
        onDragEnd={handleDragEnd}
      >
        <Grid templateColumns="1fr 2fr" h="calc(80vh - 50px)" gap={6} px={6}>
          <Card>
            <CardHeader>
              <Text color="#fff" fontSize="lg" fontWeight="bold">
                Dataset Properties
              </Text>
            </CardHeader>
            <Divider borderColor="#fff" mb={4} />
            <CardBody>
              <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                {Object.keys(datasetProperties).map((category) => (
                  <Droppable key={category} droppableId={category}>
                    {(provided) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        p={4}
                        mb={4}
                        bg="gray.800"
                        borderRadius="lg"
                        boxShadow="lg"
                      >
                        <Text color="gray.300" fontWeight="bold" mb={2}>
                          {category.toUpperCase()}
                        </Text>
                        {datasetProperties[category]?.map((prop, index) => (
                          <Draggable
                            key={prop}
                            draggableId={prop}
                            index={index}
                          >
                            {(provided, snapshot) => {
                              const child = (
                                <Box
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  p={3}
                                  bg="blue.500"
                                  borderRadius="md"
                                  color="white"
                                  fontWeight="bold"
                                  textAlign="center"
                                  zIndex={snapshot.isDragging ? 1000 : "auto"} // ✅ 드래그 중 최상단 유지
                                  position={
                                    snapshot.isDragging ? "fixed" : "relative"
                                  } // ✅ 드래그 시 고정
                                  left={
                                    snapshot.isDragging
                                      ? `${provided.draggableProps.style.left}px`
                                      : "auto"
                                  }
                                  top={
                                    snapshot.isDragging
                                      ? `${provided.draggableProps.style.top}px`
                                      : "auto"
                                  }
                                  mb={2}
                                >
                                  <Text fontSize={"small"}>{prop}</Text>
                                </Box>
                              );

                              return snapshot.isDragging
                                ? createPortal(child, document.body)
                                : child;
                            }}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                ))}
              </Grid>
            </CardBody>
          </Card>

          <Grid templateColumns="repeat(3, 1fr)" gap={4}>
            {Object.keys(categorizedProperties).map((category) => (
              <Card key={category}>
                <CardHeader>
                  <Text color="#fff" fontSize="lg" fontWeight="bold">
                    {category.charAt(0).toUpperCase() + category.slice(1)}{" "}
                    Properties
                  </Text>
                </CardHeader>
                <Divider borderColor="#fff" mb={4} />
                <CardBody>
                  <Droppable droppableId={category}>
                    {(provided) => {
                      return (
                        <Box
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          p={4}
                          minH="600px"
                          minW="100%"
                          bg="transparent"
                          borderRadius="lg"
                          border="1px dashed #fff"
                          boxShadow="lg"
                        >
                          {categorizedProperties[category]?.map(
                            (prop, index) => (
                              <Draggable
                                key={prop}
                                draggableId={prop}
                                index={index}
                              >
                                {(provided, snapshot) => {
                                  const child = (
                                    <Box
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      p={3}
                                      bg="green.500"
                                      borderRadius="md"
                                      color="white"
                                      fontWeight="bold"
                                      textAlign="center"
                                      zIndex={
                                        snapshot.isDragging ? 1000 : "auto"
                                      } // ✅ 드래그 중 최상단 유지
                                      position={
                                        snapshot.isDragging
                                          ? "fixed"
                                          : "relative"
                                      } // ✅ 드래그 시 고정
                                      left={
                                        snapshot.isDragging
                                          ? `${provided.draggableProps.style.left}px`
                                          : "auto"
                                      }
                                      top={
                                        snapshot.isDragging
                                          ? `${provided.draggableProps.style.top}px`
                                          : "auto"
                                      }
                                      mb={2}
                                    >
                                      {prop}
                                    </Box>
                                  );

                                  return snapshot.isDragging
                                    ? createPortal(child, document.body)
                                    : child;
                                }}
                              </Draggable>
                            )
                          )}
                          {provided.placeholder}
                        </Box>
                      );
                    }}
                  </Droppable>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </Grid>
      </DragDropContext>
    </Flex>
  );
};

export default ConfigurePropertiesPage;
