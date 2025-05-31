<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useSearchStore } from "../../../store/searchStore";
import { useContentStore } from "../../../store/contentStore";

const router = useRouter();

const searchStore = useSearchStore();
const contentStore = useContentStore();

// Local state for filters (separate from store)
const localSelectedCity = ref("");
const localSelectedTopics = ref([]);
const localSelectedDepartments = ref([]);

// Initialize local state from store when component is created
const initializeLocalState = () => {
	localSelectedCity.value = searchStore.selectedCity;
	localSelectedTopics.value = [...searchStore.selectedTopics];
	localSelectedDepartments.value = [...searchStore.selectedDepartments];
};

// Initialize on component mount
initializeLocalState();

const selectedItems = computed(() => {
	const items = [];
	
	// Add selected topics - need to get name from dashboard index
	if (!localSelectedCity.value) {
		return items;
	}
	
	const cityDashboards = contentStore.getDashboardsByCity(localSelectedCity.value);
	if (!cityDashboards) {
		return items;
	}
	
	localSelectedTopics.value.forEach(topicIndex => {
		const dashboard = cityDashboards.find(d => d.index === topicIndex);
		if (dashboard) {
			items.push({ 
				type: "topic", 
				id: topicIndex, 
				name: dashboard.name 
			});
		}
	});
	
	// Add selected departments
	localSelectedDepartments.value.forEach(departmentName => {
		items.push({ 
			type: "department", 
			id: departmentName, 
			name: departmentName 
		});
	});
	
	return items;
});

const cityOptions = computed(() => {
	if (contentStore.cityManager && contentStore.cityManager.allCities) {
		return contentStore.cityManager.allCities;
	}
	return [];
});

const topicTags = computed(() => {
	if (!localSelectedCity.value) {
		return [];
	}
	
	const cityDashboards = contentStore.getDashboardsByCity(localSelectedCity.value);
	if (!Array.isArray(cityDashboards)) {
		return [];
	}
	
	return cityDashboards.map(dashboard => ({
		index: dashboard.index,
		name: dashboard.name
	}));
});

const departmentTags = computed(() => {
	if (!localSelectedCity.value) {
		return [];
	}
	
	if (!contentStore.cityDashboard.components || !Array.isArray(contentStore.cityDashboard.components)) {
		return [];
	}
	
	const uniqueSources = new Set();
	contentStore.cityDashboard.components.forEach(component => {
		if (!component.source) {
			return;
		}
		
		// 根據城市過濾組件
		if (!component.city || component.city === localSelectedCity.value) {
			uniqueSources.add(component.source);
		}
	});
	
	return Array.from(uniqueSources);
});

const handleClose = () => {
	searchStore.searchOffcanvas = false;
	// Reset local state to store state (discard changes)
	initializeLocalState();
};

const toggleTopic = (topicIndex) => {
	const index = localSelectedTopics.value.indexOf(topicIndex);
	if (index > -1) {
		localSelectedTopics.value.splice(index, 1);
	} else {
		localSelectedTopics.value.push(topicIndex);
	}
};

const toggleDepartment = (departmentName) => {
	const index = localSelectedDepartments.value.indexOf(departmentName);
	if (index > -1) {
		localSelectedDepartments.value.splice(index, 1);
	} else {
		localSelectedDepartments.value.push(departmentName);
	}
};

const handleCityChange = (event) => {
	localSelectedCity.value = event.target.value;
	// Clear local selections when city changes
	localSelectedTopics.value = [];
	localSelectedDepartments.value = [];
};

const removeSelectedItem = (item) => {
	if (item.type === "topic") {
		const index = localSelectedTopics.value.indexOf(item.id);
		if (index > -1) {
			localSelectedTopics.value.splice(index, 1);
		}
	} else if (item.type === "department") {
		const index = localSelectedDepartments.value.indexOf(item.id);
		if (index > -1) {
			localSelectedDepartments.value.splice(index, 1);
		}
	}
};

const clearAllFilters = () => {
	localSelectedCity.value = "";
	localSelectedTopics.value = [];
	localSelectedDepartments.value = [];
};

const syncToStore = () => {
	// Sync local state to store
	searchStore.setSelectedCity(localSelectedCity.value);
	searchStore.selectedTopics = [...localSelectedTopics.value];
	searchStore.selectedDepartments = [...localSelectedDepartments.value];
};

const startSearch = () => {
	// Sync local state to store before searching
	syncToStore();
	searchStore.performSearch();
	searchStore.searchOffcanvas = false;
	router.push("/search-result");
};

const isTopicSelected = (topicIndex) => localSelectedTopics.value.includes(topicIndex);
const isDepartmentSelected = (departmentName) => localSelectedDepartments.value.includes(departmentName);
</script>

<template>
  <Transition name="offcanvas">
    <div
      v-if="searchStore.searchOffcanvas"
      class="search-offcanvas"
    >	
      <!-- Offcanvas panel -->
      <div class="search-offcanvas-panel">
        <!-- Header -->
        <div class="search-offcanvas-header">
          <h2>所有篩選條件</h2>
          <button
            class="search-offcanvas-close"
            @click="handleClose"
          >
            <span>close</span>
          </button>
        </div>

        <!-- Selected Filters Section -->
        <div 
          v-if="selectedItems.length > 0" 
          class="selected-filters-section"
        >
          <div class="selected-filters-title">
            <span>已設條件</span>
          </div>
          <div class="selected-filters-container">
            <div
              v-for="item in selectedItems"
              :key="`${item.type}-${item.id}`"
              class="selected-filter-badge"
            >
              <span class="badge-text">{{ item.name }}</span>
              <button
                class="badge-remove"
                @click="removeSelectedItem(item)"
              >
                <span>close</span>
              </button>
            </div>
          </div>
        </div>
		
        <!-- Content -->
        <div class="search-offcanvas-content">
          <!-- City -->
          <div class="filter-section">
            <div class="filter-title">
              <div class="filter-indicator" />
              <span>縣市</span>
            </div>
			
            <div class="tag-group">
              <div class="city-select-container">
                <select 
                  :value="localSelectedCity"
                  class="city-select"
                  @change="handleCityChange"
                >
                  <option
                    value=""
                    disabled
                  >
                    請選擇縣市
                  </option>
                  <option
                    v-for="city in cityOptions"
                    :key="city.value"
                    :value="city.value"
                  >
                    {{ city.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Category Tags -->
          <div 
            v-if="topicTags.length > 0"
            class="filter-section"
          >
            <div class="filter-title">
              <div class="filter-indicator" />
              <span>主題類別</span>
            </div>
			
            <div class="tag-group">
              <button
                v-for="topic in topicTags"
                :key="topic.index"
                :class="['filter-tag', { selected: isTopicSelected(topic.index) }]"
                @click="toggleTopic(topic.index)"
              >
                {{ topic.name }}
              </button>
            </div>
          </div>

          <!-- Department Tags -->
          <div 
            v-if="departmentTags.length > 0"
            class="filter-section"
          >
            <div class="filter-title">
              <div class="filter-indicator" />
              <span>單位</span>
            </div>
			
            <div class="tag-group">
              <button
                v-for="departmentName in departmentTags"
                :key="departmentName"
                :class="['filter-tag', { selected: isDepartmentSelected(departmentName) }]"
                @click="toggleDepartment(departmentName)"
              >
                {{ departmentName }}
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="search-offcanvas-footer">
          <button
            class="clear-all-btn"
            @click="clearAllFilters"
          >
            清除全部
          </button>
          <button
            class="start-search-btn"
            :disabled="searchStore.isSearching"
            @click="startSearch"
          >
            {{ searchStore.isSearching ? '搜尋中...' : '開始搜尋' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Backdrop -->
  <Transition name="offcanvas-backdrop">
    <div
      v-if="searchStore.searchOffcanvas"
      class="search-offcanvas-backdrop"
      @click.stop="handleClose"
    />
  </Transition>
</template>

<style scoped lang="scss">
.search-offcanvas {
	position: absolute;
	width: min-content;
	top: 0;
	right: 0;
	height: 100%;
	z-index: 20;
	display: flex;

	&-backdrop {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 19;
	}

	&-panel {
		position: relative;
		width: 558px;
		height: 100%;
		margin-left: auto;
		background-color: var(--color-background);
		border-left: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;

		@media (max-width: 768px) {
			width: 100vw;
			border-left: none;
		}
	}

	&-header {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: var(--font-m);
		border-bottom: 1px solid var(--color-border);
		position: relative;

		h2 {
			font-size: 20px;
			font-weight: 700;
			color: var(--color-normal-text);
		}
	}

	&-close {
		position: absolute;
		top: 16px;
		right: 16px;
		width: 16px;
		height: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: transparent;
		color: var(--color-normal-text);
		border: none;
		cursor: pointer;

		span {
			font-family: var(--font-icon);
			font-size: calc(var(--font-ms) * var(--font-to-icon));
		}
	}

	&-content {
		flex: 1;
		padding: 32px 45px;
		overflow-x: hidden;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 32px;

		&::-webkit-scrollbar {
			width: 4px;
		}
		&::-webkit-scrollbar-thumb {
			background-color: rgba(136, 135, 135, 0.5);
			border-radius: 4px;
		}
		&::-webkit-scrollbar-thumb:hover {
			background-color: rgba(136, 135, 135, 1);
		}
	}

	&-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--font-m) 45px;
		border-top: 1px solid var(--color-border);
	}
}

.selected-filters-section {
	padding: 20px 45px 0;
	border-bottom: 1px solid var(--color-border);
}

.selected-filters-title {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 14px;

	span {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-normal-text);
	}
}

.selected-filters-container {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	padding-bottom: 20px;
}

.selected-filter-badge {
	display: flex;
	align-items: center;
	gap: 4px;
	background-color: var(--color-highlight);
	border: 1px solid var(--color-highlight);
	border-radius: 9999px;
	padding: 6px 12px;
	font-size: 12px;
	font-weight: 600;
	color: var(--color-normal-text);
	
	.badge-text {
		color: var(--color-normal-text);
	}
	
	.badge-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 15px;
		height: 15px;
		background: transparent;
		border: none;
		cursor: pointer;
		
		span {
			font-family: var(--font-icon);
			font-size: 10px;
			color: var(--color-normal-text);
		}
	}
}

.filter-section {
	display: flex;
	flex-direction: column;
	flex-shrink: 0;
	gap: 15px;
}

.filter-title {
	display: flex;
	align-items: center;
	gap: 8px;

	span {
		font-size: 16px;
		color: var(--color-normal-text);
	}
}

.filter-indicator {
	width: 4px;
	height: 16px;
	background-color: var(--color-normal-text);
	border-radius: 5px;
}

.filter-divider {
	width: 100%;
	height: 1px;
	background-color: var(--color-border);
	margin: 0 45px;
	width: calc(100% - 90px);
}

.tag-group {
	display: flex;
	flex-wrap: wrap;
	gap: 15px;
}

.city-select-container {
	width: 100%;
}

.city-select {
	width: 100%;
	padding: 8px 12px;
	border: 1px solid var(--color-border);
	border-radius: 4px;
	background-color: var(--color-background);
	color: var(--color-normal-text);
	font-size: 14px;
	cursor: pointer;

	&:focus {
		outline: none;
		border-color: var(--color-highlight);
	}

	option {
		background-color: var(--color-background);
		color: var(--color-normal-text);
	}
}

.filter-tag {
	padding: 6px 8px;
	border-radius: 9999px;
	border: 1px solid var(--color-highlight);
	background-color: transparent;
	color: var(--color-highlight);
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;

	&.selected {
		background-color: var(--color-highlight);
		color: var(--color-normal-text);
	}

	&:hover {
		background-color: var(--color-highlight);
		color: var(--color-normal-text);
	}
}

.clear-all-btn {
	color: var(--color-normal-text);
	background-color: transparent;
	border: none;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	text-decoration: underline;
}

.start-search-btn {
	background-color: var(--color-highlight);
	color: var(--color-normal-text);
	border: none;
	border-radius: 4px;
	padding: 8px 16px;
	font-size: 16px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
}

.offcanvas-enter-active {
  transition: transform 0.3s ease-out;
}

.offcanvas-leave-active {
  transition: transform 0.3s ease-in;
}

.offcanvas-enter-from,
.offcanvas-leave-to {
  transform: translateX(100%);
}

.offcanvas-backdrop-enter-active {
  transition: opacity 0.3s ease-out;
}

.offcanvas-backdrop-leave-active {
  transition: opacity 0.3s ease-in;
}

.offcanvas-backdrop-enter-from,
.offcanvas-backdrop-leave-to {
  opacity: 0;
}
</style> 
