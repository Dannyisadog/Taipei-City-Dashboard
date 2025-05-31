<script setup>
import { computed, onBeforeMount } from "vue";
import { useRouter } from "vue-router";
import DashboardComponent from "../dashboardComponent/DashboardComponent.vue";
import { useContentStore } from "../store/contentStore";
import { useSearchStore } from "../store/searchStore";
import { useDialogStore } from "../store/dialogStore";
import { useAuthStore } from "../store/authStore";

import MoreInfo from "../components/dialogs/MoreInfo.vue";
import ReportIssue from "../components/dialogs/ReportIssue.vue";

const router = useRouter();

const contentStore = useContentStore();
const searchStore = useSearchStore();
const dialogStore = useDialogStore();
const authStore = useAuthStore();

const searchResults = computed(() => {
	const params = searchStore.searchParams;
	
	if (!searchStore.searchParams.keyword && !params.city && params.topics.length === 0 && params.departments.length === 0) {
		return [];
	}
	
	if (!contentStore.cityDashboard.components || !Array.isArray(contentStore.cityDashboard.components)) {
		return [];
	}
	
	const allComponents = [...contentStore.cityDashboard.components];
	const filteredComponents = allComponents.filter(component => {
		if (searchStore.selectedCity && component.city !== searchStore.selectedCity) {
			return false;
		}
		
		if (searchStore.searchParams.keyword) {
			const keyword = searchStore.searchParams.keyword.toLowerCase();
			const nameMatch = component.name?.toLowerCase().includes(keyword);
			
			if (!nameMatch) {
				return false;
			}
		}
		
		if (params.topics.length > 0) {
			// 從 dashboards Map 中獲取該城市的 dashboards
			const cityDashboards = contentStore.dashboards.get(searchStore.selectedCity);
			
			if (!cityDashboards || !Array.isArray(cityDashboards)) {
				return false;
			}
			
			const selectedComponentIds = new Set();
			params.topics.forEach(topicName => {
				// 根據 name 找到對應的 dashboard
				const dashboard = cityDashboards.find(d => d.name === topicName);
				if (dashboard && dashboard.components) {
					dashboard.components.forEach(componentId => {
						selectedComponentIds.add(componentId);
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
	
	return filteredComponents;
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

function goBack() {
	router.back();
}

onBeforeMount(() => {
	const params = searchStore.searchParams;
	
	// no search conditions
	if (!params.keyword && !params.city && params.topics.length === 0 && params.departments.length === 0) {
		router.push("/dashboard");
		return;
	}
});
</script>

<template>
  <div class="search-result">
    <!-- Header -->
    <div class="search-result-header">
      <div class="search-result-nav">
        <button 
          class="back-btn"
          @click="goBack"
        >
          <span>chevron_left</span>
          返回儀表板總覽
        </button>
        <h1>搜尋結果</h1>
      </div>
    </div>

    <!-- Results -->
    <div 
      v-show="searchResults.length > 0"
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
      <MoreInfo />
      <ReportIssue />
    </div>

    <!-- No Results -->
    <div 
      v-show="searchResults.length === 0"
      class="dashboard dashboard-nodashboard"
    >
      <div class="dashboard-nodashboard-content">
        <h2>找不到您想搜尋的資料。換個關鍵字或利用進階搜尋試試？</h2>
        <img
          src="/images/poor_dog.png"
          alt="poor dog"
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
        color: var(--color-complement-text);
      }

      h2 {
        margin-bottom: var(--font-s);
        color: var(--color-normal-text);
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

