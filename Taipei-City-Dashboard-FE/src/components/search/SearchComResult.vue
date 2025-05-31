<script setup>
import { computed } from "vue";
import DashboardComponent from "../../dashboardComponent/DashboardComponent.vue";
import { useContentStore } from "../../store/contentStore";
import { useSearchStore } from "../../store/searchStore";
import { useDialogStore } from "../../store/dialogStore";
import { useAuthStore } from "../../store/authStore";
import router from "../../router";

const contentStore = useContentStore();
const searchStore = useSearchStore();
const dialogStore = useDialogStore();
const authStore = useAuthStore();

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
			
			// 如果有選擇特定城市，則只搜尋那些城市；否則搜尋所有城市
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

function toggleFavorite(id) {
	if (contentStore.favorites?.components.includes(id)) {
		contentStore.unfavoriteComponent(id);
		return;
	}
	
	contentStore.favoriteComponent(id);
}

function handleMoreInfo(item) {
	if (authStore.isMobileDevice && authStore.isNarrowDevice) {
		router.push({
			name: "component-info",
			params: { index: item.index },
		});
		return;
	}
	
	dialogStore.showMoreInfo(item);
}
</script>

<template>
  <div>
    <!-- 1. Filtered Components -->
    <div 
      v-if="searchResults?.length !== 0"
      class="dashboard"
    >
      <DashboardComponent
        v-for="item in searchResults"
        :key="`${item.index}-${item.city}`"
        :config="item"
        :info-btn="true"
        :active-city="item.city"
        :select-btn="true"
        :select-btn-disabled="contentStore.cityManager.getSelectList(item.city).length === 1"
        :select-btn-list="contentStore.cityManager.getSelectList(item.city)"
        :city-tag="contentStore.cityManager.getTagList(item.city)"
        :favorite-btn="authStore.token ? true : false"
        :is-favorite="contentStore.favorites?.components.includes(item.id)"
        @favorite="
          (id) => {
            toggleFavorite(id);
          }
        "
        @info="
          (item) => {
            handleMoreInfo(item);
          }
        "
        @change-city="(city)=> {
          const selectedData = contentStore.cityDashboard.components.find((data) => {
            return data.index === item.index && data.city === city;
          });

          if (!selectedData) return;

          const componentIndex = contentStore.currentDashboard.components.findIndex(
            (item) => item.id === selectedData.id
          );

          contentStore.setComponentData(componentIndex, selectedData);
        }"
      />
    </div>
    <!-- 2. If dashboard is still loading -->
    <div
      v-else-if="contentStore.loading"
      class="dashboard dashboard-nodashboard"
    >
      <div class="dashboard-nodashboard-content">
        <div />
      </div>
    </div>
    <!-- 3. If dashboard failed to load -->
    <div
      v-else-if="contentStore.error"
      class="dashboard dashboard-nodashboard"
    >
      <div class="dashboard-nodashboard-content">
        <span>sentiment_very_dissatisfied</span>
        <h2>發生錯誤，無法載入儀表板</h2>
      </div>
    </div>
    <!-- 4. No Results -->
    <div 
      v-else
      class="dashboard dashboard-nodashboard"
    >
      <div class="dashboard-nodashboard-content">
        <h2>找不到您想搜尋的資料。換個關鍵字或利用進階搜尋試試？</h2>
        <img
          src="/images/poor_dog.png"
          alt="poor dog"
          style="max-width: 250; height: auto;"
        >
        <button
          class="start-search-btn"
          @click="searchStore.openSearchOffcanvas"
        >
          進階搜尋
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
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

.dashboard {
	max-height: calc(100vh - 127px);
	max-height: calc(var(--vh) * 100 - 127px);
	display: grid;
	row-gap: var(--font-s);
	column-gap: var(--font-s);
	margin: var(--font-m) var(--font-m);
	overflow-y: scroll;

	@media (min-width: 720px) {
		grid-template-columns: 1fr 1fr;
	}

	@media (min-width: 1200px) {
		grid-template-columns: 1fr 1fr 1fr;
	}

	@media (min-width: 1800px) {
		grid-template-columns: 1fr 1fr 1fr 1fr;
	}

	@media (min-width: 2200px) {
		grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
	}

	&-nodashboard {
		grid-template-columns: 1fr;

		&-content {
			width: 100%;
			height: calc(100vh - 127px);
			height: calc(var(--vh) * 100 - 127px);
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			row-gap: 45px;

			span {
				margin-bottom: var(--font-ms);
				font-family: var(--font-icon);
				font-size: 2rem;
			}

			div {
				width: 2rem;
				height: 2rem;
				border-radius: 50%;
				border: solid 4px var(--color-border);
				border-top: solid 4px var(--color-highlight);
				animation: spin 0.7s ease-in-out infinite;
			}
		}
	}
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}
</style>
