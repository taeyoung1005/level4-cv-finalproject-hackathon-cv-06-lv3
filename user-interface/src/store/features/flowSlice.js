import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = "http://10.28.224.157:30258/data-processing";

//
// -------------------- Flows API Thunks --------------------
//

// 특정 프로젝트의 Flows 가져오기
export const fetchFlowsByProject = createAsyncThunk(
  "flows/fetchFlowsByProject",
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/flows/?project_id=${projectId}`
      );
      if (!response.ok) throw new Error("Failed to fetch flows");

      const data = await response.json();
      console.log("🔹 API 응답:", data);

      if (!Array.isArray(data.flows)) {
        throw new Error("Invalid response format: flows is not an array");
      }

      // ✅ "flows" 키 아래의 배열을 변환 (id → flowId)
      const formattedFlows = Object.fromEntries(
        data.flows.map((flow) => [
          flow.id,
          { ...flow, flowId: flow.id, projectId },
        ])
      );

      console.log("✅ 변환된 Flow 데이터:", formattedFlows);
      return { projectId, flows: formattedFlows };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Flow 추가
export const addFlowAsync = createAsyncThunk(
  "flows/addFlow",
  async ({ projectId, flowName }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/flows/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, flow_name: flowName }),
      });

      if (!response.ok) throw new Error("Failed to add flow");

      const newFlow = await response.json();

      return {
        flowId: newFlow.flow_id,
        flow: {
          flowId: newFlow.flow_id,
          projectId,
          flow_name: flowName, // ✅ flow_name 저장
        },
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Flow 수정
export const editFlowAsync = createAsyncThunk(
  "flows/editFlow",
  async ({ flowId, flowName }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/flows/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flow_id: flowId, flow_name: flowName }),
      });

      if (!response.ok) throw new Error("Failed to edit flow");

      return { flowId, flowName };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Flow 삭제
export const deleteFlowAsync = createAsyncThunk(
  "flows/deleteFlow",
  async ({ flowId }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/flows/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flow_id: flowId }),
      });

      if (!response.ok) throw new Error("Failed to delete flow");

      return flowId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

//
// -------------------- Dataset 관련 Thunks 추가 --------------------
//

// ✅ 특정 Flow에 추가된 CSV 목록 조회
export const fetchFlowDatasets = createAsyncThunk(
  "flows/fetchFlowDatasets",
  async (flowId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/flows/csv-add/?flow_id=${flowId}`
      );
      if (!response.ok) throw new Error("Failed to fetch flow datasets");

      const data = await response.json();
      console.log("🔹 Flow Datasets API Response:", data);

      // 🔍 응답 검증
      if (!data.csvs || !Array.isArray(data.csvs)) {
        console.error(
          "❌ API response does not contain a valid csvs array:",
          data
        );
        return rejectWithValue("Invalid API response");
      }

      // ✅ "csvs" 배열을 변환하여 flow에 저장
      const formattedDatasets = data.csvs.map(({ id, csv_name }) => {
        if (typeof csv_name !== "string") {
          console.error("❌ Invalid csv_name:", csv_name);
          return { csvId: id, fileName: "Unknown" }; // 기본값 설정
        }

        return {
          csvId: id,
          fileName: csv_name,
        };
      });

      console.log("✅ Transformed Flow Datasets:", formattedDatasets);

      return { flowId, datasets: formattedDatasets };
    } catch (error) {
      console.error("❌ fetchFlowDatasets Error:", error);
      return rejectWithValue(error.message);
    }
  }
);

// ✅ Flow에 CSV 추가
export const addCsvToFlow = createAsyncThunk(
  "flows/addCsvToFlow",
  async ({ flowId, csvIds }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/flows/csv-add/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flow_id: parseInt(flowId), csv_ids: csvIds }),
      });

      if (!response.ok) throw new Error("Failed to add CSV to flow");

      return { flowId, csvIds };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ✅ 특정 Flow의 properties 조회
export const fetchFlowProperties = createAsyncThunk(
  "flows/fetchFlowProperties",
  async (flowId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/concat-columns/?flow_id=${flowId}`
      );
      if (!response.ok) throw new Error("Failed to fetch properties");

      const data = await response.json();
      console.log("✅ Properties API Response:", data);

      return { flowId, properties: data };
    } catch (error) {
      console.error("❌ Error fetching properties:", error);
      return rejectWithValue(error.message);
    }
  }
);

// ✅ 특정 Flow의 히스토그램 데이터 가져오기
export const fetchFlowHistograms = createAsyncThunk(
  "flows/fetchFlowHistograms",
  async (flowId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/histograms/all?flow_id=${flowId}`
      );
      if (!response.ok) throw new Error("Failed to fetch histograms");

      const data = await response.json();
      console.log("✅ Histograms API Response:", data);

      return { flowId, histograms: data.histograms };
    } catch (error) {
      console.error("❌ Error fetching histograms:", error);
      return rejectWithValue(error.message);
    }
  }
);

// ✅ 새로운 카테고리 정보 PUT 요청 (Next Step 버튼 클릭 시 실행)
export const savePropertyCategories = createAsyncThunk(
  "flows/savePropertyCategories",
  async ({ flowId, update }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/concat-columns/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });

      if (!response.ok) throw new Error("Failed to update property categories");

      return { flowId, update };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ✅ 우선순위 저장 API 호출
export const savePriorities = createAsyncThunk(
  "flows/savePriorities",
  async ({ flowId, priorities }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/priorities/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flow_id: flowId, priorities }),
      });

      if (!response.ok) throw new Error("Failed to save priorities");

      return { flowId, priorities };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

//
// -------------------- Redux Slice --------------------
//

const initialState = {
  flows: {}, // Flow별 상태 관리 (flowId 기반 저장)
  priorities: {},
  optimizationData: {},
  histograms: {},
  properties: {}, // ✅ concat_csv_id를 키로 하는 properties 저장 공간 추가
  newCategories: {},
  status: "idle",
  error: null,
};

const flowSlice = createSlice({
  name: "flows",
  initialState,
  reducers: {
    initializeFlow: (state, action) => {
      const { flowId, concatCsvId = 3 } = action.payload; // ✅ 기본값 설정
      if (!state.flows[flowId]) {
        state.flows[flowId] = {
          datasets: [],
          concat_csv_id: concatCsvId, // ✅ 기본값 적용
        };
      }
    },
    setCurrentStep: (state, action) => {
      const { flowId, step } = action.payload;
      if (state.flows[flowId]) {
        state.flows[flowId].currentStep = step;
      }
    },
    setConcatCsvId: (state, action) => {
      const { flowId, concatCsvId } = action.payload;
      if (state.flows[flowId]) {
        state.flows[flowId].concat_csv_id = concatCsvId;
      }
    },
    initializeCategories: (state, action) => {
      const { flowId, properties } = action.payload;

      if (!state.properties[flowId]) {
        state.properties[flowId] = properties; // ✅ 기존 properties 저장
      }

      if (!state.newCategories[flowId]) {
        state.newCategories[flowId] = {}; // ✅ 새로운 category 저장 공간 초기화
      }
    },

    updateCategory: (state, action) => {
      const { flowId, property, category } = action.payload;

      if (!state.newCategories[flowId]) {
        state.newCategories[flowId] = {};
      }

      // ✅ property에 대한 새로운 category 정보 추가
      state.newCategories[flowId][property] = category;
    },
    updateOptimizationData: (state, action) => {
      const { flowId, property, newData, type } = action.payload;
      if (!state.optimizationData[flowId]) {
        state.optimizationData[flowId] = {};
      }
      state.optimizationData[flowId][property] = {
        ...state.optimizationData[flowId][property],
        ...newData,
        type,
      };
    },
    updatePriorities: (state, action) => {
      const { flowId, priorities } = action.payload;
      state.priorities[flowId] = priorities;
    },
    initializePriorities: (state, action) => {
      const { flowId } = action.payload;

      if (!state.priorities[flowId] && state.optimizationData[flowId]) {
        state.priorities[flowId] = Object.keys(state.optimizationData[flowId]);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFlowsByProject.fulfilled, (state, action) => {
        const { flows } = action.payload;
        state.flows = { ...state.flows, ...flows };
      })
      .addCase(fetchFlowsByProject.rejected, (state, action) => {
        console.error("❌ Flow 데이터 요청 실패:", action.payload);
        state.error = action.payload;
      })
      .addCase(addFlowAsync.fulfilled, (state, action) => {
        const { flowId, flow } = action.payload;
        state.flows[flowId] = flow;
      })
      .addCase(deleteFlowAsync.fulfilled, (state, action) => {
        delete state.flows[action.payload];
      })
      .addCase(editFlowAsync.fulfilled, (state, action) => {
        const { flowId, flowName } = action.payload;
        if (state.flows[flowId]) {
          state.flows[flowId].flow_name = flowName;
        }
      })
      // ✅ Flow에 추가된 CSV 목록 조회 성공
      .addCase(fetchFlowDatasets.fulfilled, (state, action) => {
        const { flowId, datasets } = action.payload;
        if (!state.flows[flowId]) {
          state.flows[flowId] = { datasets: [] };
        }
        console.log(datasets);
        state.flows[flowId].datasets = datasets.map((p) => p.csvId);
        console.log(state.flows[flowId].datasets);
      })
      .addCase(fetchFlowDatasets.rejected, (state, action) => {
        console.error("❌ Failed to fetch flow datasets:", action.payload);
        state.error = action.payload;
      })

      // ✅ Flow에 CSV 추가 성공
      .addCase(addCsvToFlow.fulfilled, (state, action) => {
        const { flowId, csvIds } = action.payload;

        if (!state.flows[flowId]) {
          state.flows[flowId] = { datasets: [] };
        }

        // 기존 csvId 리스트 가져오기 (기본적으로 빈 배열)
        const existingIds = state.flows[flowId].datasets || [];

        // 중복되지 않은 새로운 csvId만 추가
        const newDatasets = csvIds.filter((id) => !existingIds.includes(id));

        console.log("newDatasets (추가할 CSV ID):", newDatasets);

        // 최종적으로 csvId 배열을 유지
        state.flows[flowId].datasets = [...existingIds, ...newDatasets];
      })
      .addCase(addCsvToFlow.rejected, (state, action) => {
        console.error("❌ Failed to add CSV to flow:", action.payload);
        state.error = action.payload;
      })
      .addCase(fetchFlowProperties.fulfilled, (state, action) => {
        const { flowId, properties } = action.payload;
        state.properties[flowId] = properties; // ✅ properties 저장
      })
      .addCase(fetchFlowHistograms.fulfilled, (state, action) => {
        const { flowId, histograms } = action.payload;
        state.histograms[flowId] = histograms;
      })
      .addCase(fetchFlowHistograms.rejected, (state, action) => {
        console.error("❌ Failed to fetch histograms:", action.payload);
        state.error = action.payload;
      })
      .addCase(savePropertyCategories.fulfilled, (state, action) => {
        console.log(
          "✅ Property categories successfully updated:",
          action.payload
        );
      })
      .addCase(savePropertyCategories.rejected, (state, action) => {
        console.error(
          "❌ Failed to update property categories:",
          action.payload
        );
        state.error = action.payload;
      });
  },
});

export const {
  initializeFlow,
  setCurrentStep,
  initializeCategories,
  updateCategory,
  updateOptimizationData,
  updatePriorities,
  initializePriorities,
} = flowSlice.actions;
export default flowSlice.reducer;
