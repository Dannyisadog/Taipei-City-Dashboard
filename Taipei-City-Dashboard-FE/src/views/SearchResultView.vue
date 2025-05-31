<script setup>
import { ref, computed, watch } from "vue";
import SearchComResult from "../components/search/SearchComResult.vue";
import MoreInfo from "../components/dialogs/MoreInfo.vue";
import ReportIssue from "../components/dialogs/ReportIssue.vue";
import router from "../router";
import MapContainer from "../components/map/MapContainer.vue";
import DashboardComponent from "../dashboardComponent/DashboardComponent.vue";
import { useContentStore } from "../store/contentStore";
import { useSearchStore } from "../store/searchStore";
import { useDialogStore } from "../store/dialogStore";
import { useMapStore } from "../store/mapStore";

const contentStore = useContentStore();
const searchStore = useSearchStore();
const dialogStore = useDialogStore();
const mapStore = useMapStore();

// Tab 切換狀態
const activeTab = ref('components');

// 地圖圖層切換狀態
const toggleOn = ref([]);

function goToDashboard() {
	router.push("/dashboard");
}

// 取得搜尋結果（與 SearchComResult 相同邏輯）
const searchResults = computed(() => {
	const params = searchStore.searchParams;
	
	if (!contentStore.cityDashboard.components || !Array.isArray(contentStore.cityDashboard.components)) {
		return [];
	}
	
	const filteredComponents = contentStore.cityDashboard.components.filter(component => {
		if (searchStore.selectedCities.length > 0 && !searchStore.selectedCities.includes(component.city)) {
			return false;
		}
		
		if (params.topics.length > 0) {
			const selectedComponentIds = new Set();
			
			const citiesToSearch = searchStore.selectedCities.length > 0 
				? searchStore.selectedCities 
				: Array.from(contentStore.dashboards.keys());
			
			citiesToSearch.forEach(city => {
				const cityDashboards = contentStore.dashboards.get(city);
				if (cityDashboards && Array.isArray(cityDashboards)) {
					params.topics.forEach(topicName => {
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
		
		if (params.departments.length > 0 && !params.departments.includes(component.source)) {
			return false;
		}
		
		return true;
	});
	
	const uniqueMap = new Map();
	const uniqueComponents = filteredComponents.filter(component => {
		const key = `${component.city}_${component.index}`;
		if (!uniqueMap.has(key)) {
			uniqueMap.set(key, true);
			return true;
		}
		return false;
	});
	
	return uniqueComponents;
});

// 過濾出有地圖配置的組件
const mapComponents = computed(() => {
	return searchResults.value.filter(item => item.map_config && item.map_config[0]);
});

// 初始化切換狀態
watch(mapComponents, (newComponents) => {
	toggleOn.value = new Array(newComponents.length).fill(false);
}, { immediate: true });

// 處理地圖圖層開關
function handleToggle(value, map_config, index) {
	toggleOn.value[index] = value;
	
	if (value) {
		mapStore.addToMapLayerList(map_config);
	} else {
		mapStore.clearByParamFilter(map_config);
		mapStore.turnOffMapLayerVisibility(map_config);
	}
}

// 檢查是否應該禁用切換按鈕
function shouldDisable(map_config) {
	const allMapLayerIds = map_config.map((el) => `${el.index}-${el.type}-${el.city}`);
	return (
		mapStore.loadingLayers.filter((el) => allMapLayerIds.includes(el))
			.length > 0
	);
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
        <SearchComResult />
      </div>

      <!-- Map Tab -->
      <div
        v-else-if="activeTab === 'map'"
        class="tab-content map-view"
      >
        <div class="hide-if-mobile">
          <div
            v-if="mapComponents.length > 0"
            class="map-charts"
          >
            <h2>符合搜尋條件的地圖圖層</h2>
            <DashboardComponent
              v-for="(item, arrayIdx) in mapComponents"
              :key="`search-map-${item.index}-${item.city}`"
              :config="item"
              mode="map"
              :info-btn="true"
              :active-city="item.city"
              :select-btn="true"
              :select-btn-disabled="contentStore.cityManager.getSelectList(item.city).length === 1"
              :select-btn-list="contentStore.cityManager.getSelectList(item.city)"
              :city-tag="contentStore.cityManager.getTagList(item.city)"
              :toggle-disable="shouldDisable(item.map_config)"
              :toggle-on="toggleOn[arrayIdx]"
              @info="(item) => dialogStore.showMoreInfo(item)"
              @toggle="(value, map_config) => handleToggle(value, map_config, arrayIdx)"
              @filter-by-param="(map_filter, map_config, x, y) => mapStore.filterByParam(map_filter, map_config, x, y)"
              @filter-by-layer="(map_config, layer) => mapStore.filterByLayer(map_config, layer)"
              @clear-by-param-filter="(map_config) => mapStore.clearByParamFilter(map_config)"
              @clear-by-layer-filter="(map_config) => mapStore.clearByLayerFilter(map_config)"
              @fly="(location) => mapStore.flyToLocation(location)"
              @change-city="(city) => {
                const selectedData = contentStore.cityDashboard.components.find((data) => {
                  return data.index === item.index && data.city === city;
                });
                
                if (selectedData) {
                  mapStore.clearByParamFilter(item.map_config);
                  mapStore.turnOffMapLayerVisibility(item.map_config);
                  mapStore.addToMapLayerList(selectedData.map_config);
                }
              }"
            />
          </div>
          <div
            v-else
            class="map-charts-nodashboard"
          >
            <span>layers_clear</span>
            <h2>沒有符合條件的地圖圖層</h2>
            <p>請調整搜尋條件或切換到組件視圖查看結果</p>
          </div>
        </div>
        <MapContainer />
      </div>
    </div>
    
    <!-- Dialogs -->
    <MoreInfo />
    <ReportIssue />
  </div>
</template>

<style scoped lang="scss">
.search-result {
  &-header {
	min-height: 1.6rem;
    display: flex;
    justify-content: space-between;
    margin: 10px var(--font-m);
    padding-bottom: 0.5rem;
    border-bottom: solid 1px var(--color-border);
    user-select: none;
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
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: var(--font-xs);
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
}

.tab-content {
  height: 100%;

  &.map-view {
    height: calc(100vh - 200px);
    height: calc(var(--vh) * 100 - 200px);
    display: flex;
    margin: var(--font-m);
  }
}

.map-charts {
  width: 360px;
  max-height: 100%;
  height: fit-content;
  display: grid;
  row-gap: var(--font-m);
  margin-right: var(--font-s);
  border-radius: 5px;
  overflow-y: scroll;

  @media (min-width: 1000px) {
    width: 370px;
  }

  @media (min-width: 2000px) {
    width: 400px;
  }

  h2 {
    font-size: var(--font-l);
    font-weight: 700;
    color: var(--color-normal-text);
    margin: 0 0 var(--font-s) 0;
  }
}

.map-charts-nodashboard {
  width: 360px;
  height: calc(100vh - 200px);
  height: calc(var(--vh) * 100 - 200px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: var(--font-s);
  text-align: center;

  @media (min-width: 1000px) {
    width: 370px;
  }

  @media (min-width: 2000px) {
    width: 400px;
  }

  span {
    margin-bottom: var(--font-ms);
    font-family: var(--font-icon);
    font-size: 2rem;
    color: var(--color-complement-text);
  }

  h2 {
    font-size: var(--font-l);
    font-weight: 600;
    color: var(--color-normal-text);
    margin: 0 0 var(--font-s) 0;
  }

  p {
    color: var(--color-complement-text);
    font-size: var(--font-ms);
  }
}
</style>

