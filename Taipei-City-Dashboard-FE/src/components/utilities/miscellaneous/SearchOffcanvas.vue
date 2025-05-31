<script setup>
import { computed, onMounted, ref } from "vue";
import { useSearchStore } from "../../../store/searchStore";
import { useContentStore } from "../../../store/contentStore";
import router from "../../../router";

const searchStore = useSearchStore();
const contentStore = useContentStore();

// Local state for filters (separate from store)
const localSelectedCities = ref([]);
const localSelectedTopics = ref([]); // topic names
const localSelectedDepartments = ref([]);
const localSelectedMapData = ref(false);

// Initialize local state from store when component is created
const initializeLocalState = () => {
	localSelectedCities.value = [...searchStore.selectedCities];
	localSelectedTopics.value = [...searchStore.selectedTopics];
	localSelectedDepartments.value = [...searchStore.selectedDepartments];
	localSelectedMapData.value = searchStore.selectedMapData;
};

// Initialize on component mount
initializeLocalState();

const selectedItems = computed(() => {
	const items = [];
	
	// Add selected cities
	localSelectedCities.value.forEach(cityValue => {
		const cityOption = cityOptions.value.find(city => city.value === cityValue);
		items.push({ 
			type: "city", 
			id: cityValue, 
			name: cityOption ? cityOption.name : cityValue 
		});
	});
	
	// Add selected topics (now using names directly)
	localSelectedTopics.value.forEach(topicName => {
		items.push({ 
			type: "topic", 
			id: topicName, 
			name: topicName 
		});
	});
	
	// Add selected departments
	localSelectedDepartments.value.forEach(departmentName => {
		items.push({ 
			type: "department", 
			id: departmentName, 
			name: departmentName 
		});
	});
	
	// Add map data filter
	if (localSelectedMapData.value) {
		items.push({ 
			type: "mapData", 
			id: "mapData", 
			name: "空間資料" 
		});
	}
	
	return items;
});

const cityOptions = computed(() => {
	if (contentStore.cityManager && contentStore.cityManager.allCities) {
		return contentStore.cityManager.allCities;
	}
	return [];
});

const topicTags = computed(() => {
	const allTopics = searchStore.allTopics || [];
	
	return allTopics.map(topicName => ({
		name: topicName
	}));
});

const departmentTags = computed(() => {
	const allSources = searchStore.allSource || [];
	
	return allSources.map(source => ({
		name: source
	}));
});

const handleClose = () => {
	searchStore.closeSearchOffcanvas()
	searchStore.clearAllFilters();
};

const toggleTopic = (topicName) => {
	const index = localSelectedTopics.value.indexOf(topicName);
	if (index > -1) {
		localSelectedTopics.value.splice(index, 1);
	} else {
		localSelectedTopics.value.push(topicName);
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

const toggleCity = (cityValue) => {
	const index = localSelectedCities.value.indexOf(cityValue);
	if (index > -1) {
		localSelectedCities.value.splice(index, 1);
	} else {
		localSelectedCities.value.push(cityValue);
	}
};

const removeSelectedItem = (item) => {
	if (item.type === "city") {
		const index = localSelectedCities.value.indexOf(item.id);
		if (index > -1) {
			localSelectedCities.value.splice(index, 1);
		}
	} else if (item.type === "topic") {
		const index = localSelectedTopics.value.indexOf(item.id);
		if (index > -1) {
			localSelectedTopics.value.splice(index, 1);
		}
	} else if (item.type === "department") {
		const index = localSelectedDepartments.value.indexOf(item.id);
		if (index > -1) {
			localSelectedDepartments.value.splice(index, 1);
		}
	} else if (item.type === "mapData") {
		localSelectedMapData.value = false;
	}
};

const clearAllFilters = () => {
	localSelectedCities.value = [];
	localSelectedTopics.value = [];
	localSelectedDepartments.value = [];
	localSelectedMapData.value = false;
	searchStore.clearAllFilters();
};

const syncToStore = () => {
	searchStore.selectedCities = [...localSelectedCities.value];
	searchStore.selectedTopics = [...localSelectedTopics.value];
	searchStore.selectedDepartments = [...localSelectedDepartments.value];
	searchStore.selectedMapData = localSelectedMapData.value;
};

const startSearch = () => {
	syncToStore();
	searchStore.closeSearchOffcanvas();
	router.push("/search-result");
};

const isCitySelected = (cityValue) => localSelectedCities.value.includes(cityValue);
const isTopicSelected = (topicName) => localSelectedTopics.value.includes(topicName);
const isDepartmentSelected = (departmentName) => localSelectedDepartments.value.includes(departmentName);

const toggleMapData = () => {
	localSelectedMapData.value = !localSelectedMapData.value;
};

onMounted(async () => {
	await searchStore.setupAllSource();
});
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
              <button
                v-for="city in cityOptions"
                :key="city.value"
                :class="['filter-tag', { selected: isCitySelected(city.value) }]"
                @click="toggleCity(city.value)"
              >
                {{ city.name }}
              </button>
            </div>
          </div>

          <!-- Category Tags -->
          <div 
            class="filter-section"
          >
            <div class="filter-title">
              <div class="filter-indicator" />
              <span>主題類別</span>
            </div>
			
            <div class="tag-group">
              <button
                v-for="topic in topicTags"
                :key="topic.name"
                :class="['filter-tag', { selected: isTopicSelected(topic.name) }]"
                @click="toggleTopic(topic.name)"
              >
                {{ topic.name }}
              </button>
            </div>
          </div>

          <!-- Department Tags -->
          <div 
            class="filter-section"
          >
            <div class="filter-title">
              <div class="filter-indicator" />
              <span>資料來源單位</span>
            </div>
			
            <div class="tag-group">
              <button
                v-for="department in departmentTags"
                :key="department.name"
                :class="['filter-tag', { selected: isDepartmentSelected(department.name) }]"
                @click="toggleDepartment(department.name)"
              >
                {{ department.name }}
              </button>
            </div>
          </div>

          <!-- Map Data Filter -->
          <div class="filter-section">
            <div class="filter-title">
              <div class="filter-indicator" />
              <span>組件資訊</span>
            </div>
			
            <div class="tag-group">
              <button
                :class="['filter-tag', { selected: localSelectedMapData }]"
                @click="toggleMapData"
              >
                空間資料
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

	&:hover:not(.disabled) {
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
