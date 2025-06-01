<script setup>
import { ref, computed } from "vue";
import SearchComResult from "../components/search/SearchComResult.vue";
import SearchMapResult from "../components/search/SearchMapResult.vue";
import MoreInfo from "../components/dialogs/MoreInfo.vue";
import ReportIssue from "../components/dialogs/ReportIssue.vue";
import { useContentStore } from "../store/contentStore";
import { useSearchStore } from "../store/searchStore";
import router from "../router";

const contentStore = useContentStore();
const searchStore = useSearchStore();

// Tab 切換狀態
const activeTab = ref('components');

// 共同的篩選邏輯
const baseFilteredComponents = computed(() => {
	if (!contentStore.cityDashboard.components || !Array.isArray(contentStore.cityDashboard.components)) {
		return [];
	}
	
	return contentStore.cityDashboard.components.filter(component => {
		// 城市過濾
		if (searchStore.selectedCities.length > 0 && !searchStore.selectedCities.includes(component.city)) {
			return false;
		}
		
		// 主題過濾
		if (searchStore.selectedTopics.length > 0) {
			const selectedComponentIds = new Set();
			
			const citiesToSearch = searchStore.selectedCities.length > 0 
				? searchStore.selectedCities 
				: Array.from(contentStore.dashboards.keys());
			
			citiesToSearch.forEach(city => {
				const cityDashboards = contentStore.dashboards.get(city);
				if (cityDashboards && Array.isArray(cityDashboards)) {
					searchStore.selectedTopics.forEach(topicName => {
						const dashboard = cityDashboards.find(d => d.name === topicName);
						if (dashboard && dashboard.components) {
							dashboard.components.forEach(componentId => {
								selectedComponentIds.add(componentId);
							});
						}
					});
				}
			});
			
			if (!selectedComponentIds.has(component.id)) {
				return false;
			}
		}
		
		// 部門過濾
		if (searchStore.selectedDepartments.length > 0 && !searchStore.selectedDepartments.includes(component.source)) {
			return false;
		}
		
		// 空間資料過濾
		if (searchStore.selectedMapData && !(component.map_config && component.map_config[0] !== null && component.map_config?.length > 0)) {
			return false;
		}
		
		return true;
	});
});

function goToDashboard() {
	router.push("/dashboard");
}

// 切換 tab
function switchTab(tab) {
	activeTab.value = tab;
}
</script>

<template>
  <div class="search-result">
    <!-- Header -->
    <div class="search-result-header">
      <div class="search-result-nav">
        <button 
          class="back-btn"
          @click="goToDashboard"
        >
          <span>chevron_left</span>
          返回儀表板總覽
        </button>
        <h1>搜尋結果</h1>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button 
        :class="['tab-btn', { active: activeTab === 'components' }]"
        @click="switchTab('components')"
      >
        <span>dashboard</span>
        組件視圖
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'map' }]"
        @click="switchTab('map')"
      >
        <span>map</span>
        地圖視圖
      </button>
    </div>

    <!-- Content Area -->
    <div class="content-area">
      <!-- Components Tab -->
      <div
        v-if="activeTab === 'components'"
        class="tab-content"
      >
        <SearchComResult :filtered-components="baseFilteredComponents" />
      </div>

      <!-- Map Tab -->
      <div
        v-if="activeTab === 'map'"
        class="tab-content map-view"
      >
        <SearchMapResult :filtered-components="baseFilteredComponents" />
      </div>
    </div>
    
    <!-- Dialogs -->
    <MoreInfo />
    <ReportIssue />
  </div>
</template>

<style scoped lang="scss">
.search-result {
  height: 100vh;
  height: calc(var(--vh) * 100);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &-header {
	min-height: 1.6rem;
    display: flex;
    justify-content: space-between;
    margin: 10px var(--font-m);
    padding-bottom: 0.5rem;
    border-bottom: solid 1px var(--color-border);
    user-select: none;
    flex-shrink: 0;
  }

  &-nav {
	width: 100%;
    position: relative;
    display: flex;
	align-items: center;
	justify-content: center;
    gap: var(--font-m);

    h1 {
      font-size: var(--font-xl);
      font-weight: 700;
      color: var(--color-normal-text);
      margin: 0;
    }
  }
}

.back-btn {
  position: absolute;
  left: 0;
  display: flex;
  align-items: center;
  gap: var(--font-xs);
  padding: var(--font-xs) var(--font-s);
  background-color: transparent;
  color: var(--color-normal-text);
  cursor: pointer;
  transition: all 0.2s ease;

  span {
	font-family: var(--font-icon);
	font-size: calc(var(--font-ms) * var(--font-to-icon));
  }
}

.tab-navigation {
  display: flex;
  margin: 0 var(--font-m);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: var(--font-s);
  padding: var(--font-s) var(--font-m);
  background-color: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-complement-text);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--font-ms);
  font-weight: 500;

  span {
    font-family: var(--font-icon);
    font-size: calc(var(--font-ms) * var(--font-to-icon));
  }

  &:hover {
    color: var(--color-normal-text);
    background-color: var(--color-component-background);
  }

  &.active {
    color: var(--color-highlight);
    border-bottom-color: var(--color-highlight);
  }
}

.content-area {
  flex: 1;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  min-height: 0;
}

.tab-content {
  height: 100%;
  width: 100%;
  position: relative;
  box-sizing: border-box;
  
  &.map-view {
    height: 100%;
    margin: 0;
    padding: 0;
  }
}
</style>

