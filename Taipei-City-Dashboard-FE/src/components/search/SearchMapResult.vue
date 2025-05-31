<script setup>
import { watch, onUnmounted, computed } from "vue";
import MapContainer from "../map/MapContainer.vue";
import { useSearchStore } from "../../store/searchStore";
import { useContentStore } from "../../store/contentStore";
import { useMapStore } from "../../store/mapStore";
import { useDialogStore } from "../../store/dialogStore";

const searchStore = useSearchStore();
const contentStore = useContentStore();
const mapStore = useMapStore();
const dialogStore = useDialogStore();

// 過濾出有地圖配置的組件
const mapComponents = computed(() => {
	if (!contentStore.cityDashboard.components || !Array.isArray(contentStore.cityDashboard.components)) {
		return [];
	}
	
	const filteredComponents = contentStore.cityDashboard.components.filter(component => {
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
		
		return true;
	});
	
	// 只返回有地圖配置的組件
	const mapConfigComponents = filteredComponents.filter(item => item.map_config && item.map_config[0]);
	
	// 收集所有 map_config 項目
	const allMapConfigs = [];
	mapConfigComponents.forEach(component => {
		if (component.map_config) {
			component.map_config.forEach(mapConfig => {
				allMapConfigs.push({
					...mapConfig,
					componentId: component.id,
					componentCity: component.city,
					componentIndex: component.index
				});
			});
		}
	});
	
	// 對 map_config 項目去重，保留不同 city 的相同 index
	const uniqueMapConfigs = new Map();
	allMapConfigs.forEach(mapConfig => {
		const key = `${mapConfig.index}_${mapConfig.city}`;
		if (!uniqueMapConfigs.has(key)) {
			uniqueMapConfigs.set(key, mapConfig);
		}
	});
	
	// 重新組織成 component 格式，每個唯一的 map_config 變成一個虛擬 component
	const uniqueComponents = Array.from(uniqueMapConfigs.values()).map(mapConfig => ({
		id: mapConfig.componentId,
		city: mapConfig.componentCity,
		index: mapConfig.componentIndex,
		map_config: [mapConfig]
	}));
	
	return uniqueComponents;
});

// 加載地圖圖層的函數
function loadMapLayers() {
	const components = mapComponents.value;
	if (components && components.length > 0) {
		components.forEach(component => {
			if (component.map_config) {
				try {
					mapStore.addToMapLayerList(component.map_config);
				} catch (error) {
					console.error(`Failed to load map layer for component ${component.id}:`, error);
				}
			}
		});
	}
}

// 清除地圖圖層的函數
function clearMapLayers(components) {
	if (components && components.length > 0) {
		components.forEach(component => {
			if (component.map_config && component.map_config[0]) {
				component.map_config.forEach(mapConfig => {
					const layerId = `${mapConfig.index}-${mapConfig.type}-${mapConfig.city}`;
					const sourceId = `${layerId}-source`;
					
					try {
						// 先移除 layer
						if (mapStore.map && mapStore.map.getLayer(layerId)) {
							mapStore.map.removeLayer(layerId);
						}
						
						// 再移除 source
						if (mapStore.map && mapStore.map.getSource(sourceId)) {
							mapStore.map.removeSource(sourceId);
						}
						
						// 從 store 的狀態中移除
						mapStore.currentLayers = mapStore.currentLayers.filter(id => id !== layerId);
						mapStore.currentVisibleLayers = mapStore.currentVisibleLayers.filter(id => id !== layerId);
						delete mapStore.mapConfigs[layerId];
						
						// 清除 DeckGL 圖層
						if (mapStore.deckGlLayer[layerId]) {
							delete mapStore.deckGlLayer[layerId];
							mapStore.renderDeckGLLayer();
						}
					} catch {
						// 忽略清除時的錯誤，避免 console 噪音
					}
				});
			}
		});
	}
}

// 當搜尋結果變化時，自動加載所有地圖圖層
watch(mapComponents, (newComponents, oldComponents) => {
	// 清除舊的圖層
	clearMapLayers(oldComponents);
	
	// 檢查是否有地圖配置
	if (newComponents.length === 0) {
		dialogStore.showNotification(
			"info",
			"本次搜尋沒有空間資料，不會渲染地圖"
		);
		return;
	}
	
	// 加載新的圖層
	loadMapLayers();
}, { immediate: true });

// 組件卸載時清理圖層
onUnmounted(() => {
	clearMapLayers(mapComponents.value);
});
</script>

<template>
  <div class="search-map-result">
    <MapContainer />
  </div>
</template>

<style scoped lang="scss">
.search-map-result {
  height: calc(100vh - 200px);
  height: calc(var(--vh) * 100 - 200px);
  width: calc(100% - var(--font-m) * 2);
  margin: var(--font-m);
  position: relative;
  box-sizing: border-box;
}
</style>
