<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useSearchStore } from "../../../store/searchStore";
import { useContentStore } from "../../../store/contentStore";

const router = useRouter();

const searchStore = useSearchStore();
const contentStore = useContentStore();

const selectedItems = computed(() => searchStore.selectedItems);

const topicTags = computed(() => {
	const uniqueNames = new Set();
	
	// Extract all unique names from the dashboards Map
	for (const [, dashboards] of contentStore.dashboards.entries()) {
		if (Array.isArray(dashboards)) {
			dashboards.forEach(dashboard => {
				if (dashboard.name) {
					uniqueNames.add(dashboard.name);
				}
			});
		}
	}
	
	// Convert Set to array and return as string array
	return Array.from(uniqueNames);
});

// TODO: 更改資料來源
const departmentTags = computed(() => {
	const uniqueSources = new Set();
	
	// Extract all unique sources from cityDashboard.components
	if (contentStore.cityDashboard.components && Array.isArray(contentStore.cityDashboard.components)) {
		contentStore.cityDashboard.components.forEach(component => {
			if (component.source) {
				uniqueSources.add(component.source);
			}
		});
	}
	
	// Convert Set to array and return as string array
	return Array.from(uniqueSources);
});

const handleClose = () => {
	searchStore.searchOffcanvas = false;
	searchStore.clearAllFilters();
};

const toggleTopic = (topicName) => {
	searchStore.toggleTopic(topicName);
};

const toggleDepartment = (departmentName) => {
	searchStore.toggleDepartment(departmentName);
};

const removeSelectedItem = (item) => {
	searchStore.removeSelectedItem(item);
};

const startSearch = () => {
	searchStore.performSearch();
	router.push("/search-result");
};

const isTopicSelected = (topicName) => searchStore.selectedTopics.includes(topicName);
const isDepartmentSelected = (departmentName) => searchStore.selectedDepartments.includes(departmentName);
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
          <!-- Category Tags -->
          <div class="filter-section">
            <div class="filter-title">
              <div class="filter-indicator" />
              <span>主題類別</span>
            </div>
			
            <div class="tag-group">
              <button
                v-for="topicName in topicTags"
                :key="topicName"
                :class="['filter-tag', { selected: isTopicSelected(topicName) }]"
                @click="toggleTopic(topicName)"
              >
                {{ topicName }}
              </button>
            </div>
          </div>

          <!-- Department Tags -->
          <div class="filter-section">
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
            @click="handleClose"
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

	&:hover {
		opacity: 0.9;
	}
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
