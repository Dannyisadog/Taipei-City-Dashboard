<script setup>
import { onUnmounted, computed } from "vue";
import { watchDebounced } from '@vueuse/core'
import MapContainer from "../map/MapContainer.vue";
import { useMapStore } from "../../store/mapStore";
import { useDialogStore } from "../../store/dialogStore";

const props = defineProps({
	filteredComponents: {
		type: Array,
		default: () => []
	}
});

const mapStore = useMapStore();
const dialogStore = useDialogStore();

// 處理地圖相關的組件：只保留有地圖配置的組件，並處理 map_config 去重
const mapComponents = computed(() => {
	// 只保留有地圖配置的組件
	const mapConfigComponents = props.filteredComponents.filter(item => 
		item.map_config && item.map_config[0] !== null && item.map_config?.length > 0
	);
	
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

// 追蹤當前已加載的圖層
let currentLoadedLayers = new Set();

// 處理圖層切換的函數，類似 MapView.vue 的 handleToggle
function handleLayerToggle(shouldShow, map_config) {
	const layerId = `${map_config.index}-${map_config.type}-${map_config.city}`;
	
	if (shouldShow) {
		if (!currentLoadedLayers.has(layerId)) {
			mapStore.addToMapLayerList([map_config]);
			currentLoadedLayers.add(layerId);
		}
	} else {
		if (currentLoadedLayers.has(layerId)) {
			mapStore.clearByParamFilter([map_config]);
			mapStore.turnOffMapLayerVisibility([map_config]);
			currentLoadedLayers.delete(layerId);
		}
	}
}

// 監聽搜尋條件變化，動態更新圖層
watchDebounced(() =>props.filteredComponents, () => {
	const newComponents = mapComponents.value;
	const newLayerIds = new Set();

	// 收集新的圖層 ID
	newComponents.forEach(component => {
		if (component.map_config && component.map_config[0]) {
			component.map_config.forEach(mapConfig => {
				const layerId = `${mapConfig.index}-${mapConfig.type}-${mapConfig.city}`;
				newLayerIds.add(layerId);
			});
		}
	});
	
	// 移除不再需要的圖層
	currentLoadedLayers.forEach(layerId => {
		if (!newLayerIds.has(layerId)) {
			const parts = layerId.split('-');
			const index = parts[0];
			const type = parts[1];
			const city = parts.slice(2).join('-');
			handleLayerToggle(false, { index, type, city });
		}
	});
	
	// 添加新的圖層
	newComponents.forEach(component => {
		if (component.map_config && component.map_config[0]) {
			component.map_config.forEach(mapConfig => {
				const layerId = `${mapConfig.index}-${mapConfig.type}-${mapConfig.city}`;
				if (!currentLoadedLayers.has(layerId)) {
					handleLayerToggle(true, mapConfig);
				}
			});
		}
	});
	
	// 如果沒有地圖配置，顯示通知
	if (newComponents.length === 0 && newLayerIds.size === 0) {
		dialogStore.showNotification(
			"info",
			"本次搜尋沒有空間資料，不會渲染地圖"
		);
	}
}, {
	 immediate: true,
	 flush: 'post',
	 debounce: 300
});

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
  height: 100%;
  width: 100%;
  position: relative;
  box-sizing: border-box;
  padding: var(--font-m);
}
</style>
