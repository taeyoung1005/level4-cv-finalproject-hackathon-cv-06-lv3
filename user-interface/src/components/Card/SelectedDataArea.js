import { Box, Button, Flex, Grid, Icon, Text, Tooltip } from "@chakra-ui/react";
import React from "react";
import { FaTrashAlt } from "react-icons/fa";

function SelectedFileCard({ fileName, onDeselect }) {
  return (
    <Box
      p="12px"
      bg="linear-gradient(127.09deg, rgba(24, 29, 60, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)"
      borderRadius="20px"
      display="flex"
      alignItems="center"
    >
      <Flex
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        w="100%"
      >
        <Tooltip label={fileName} aria-label="File Name Tooltip">
          <Text
            color="#fff"
            fontSize="xs"
            fontWeight="bold"
            isTruncated
            noOfLines={1}
            maxW="180px"
          >
            {fileName}
          </Text>
        </Tooltip>
        <Button p="0px" variant="no-hover" onClick={onDeselect}>
          <Flex color="red.500" cursor="pointer" align="center" p="8px">
            <Icon as={FaTrashAlt} w="12px" h="12px" />
          </Flex>
        </Button>
      </Flex>
    </Box>
  );
}

function SelectedDataArea({
  selectedFiles = [],
  onDeselect,
  allDatasets = [],
}) {
  console.log("📌 selectedFiles (csvId 배열):", selectedFiles);
  console.log("📌 allDatasets:", allDatasets);

  // ✅ selectedFiles에서 csvId를 기준으로 allDatasets에서 파일명 찾기
  const selectedDatasets = selectedFiles.map((csvId) => {
    const dataset = allDatasets.find((d) => d.csvId === csvId);
    return dataset
      ? { csvId: dataset.csvId, fileName: dataset.csv.split("/").pop() }
      : { csvId, fileName: "Unknown File" };
  });

  console.log("✅ Transformed selectedDatasets:", selectedDatasets);

  return (
    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} w="100%">
      {selectedDatasets.length > 0 ? (
        selectedDatasets.map((file) => (
          <SelectedFileCard
            key={file.csvId}
            fileName={file.fileName} // ✅ 파일명만 표시
            onDeselect={() => onDeselect(file.csvId)} // ✅ csvId 넘겨서 삭제
          />
        ))
      ) : (
        <Text color="gray.400" textAlign="center" w="100%">
          No selected datasets.
        </Text>
      )}
    </Grid>
  );
}

export default SelectedDataArea;
