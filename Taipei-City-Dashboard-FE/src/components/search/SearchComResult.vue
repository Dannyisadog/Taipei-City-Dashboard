<script setup>
import { computed } from "vue";
import DashboardComponent from "../../dashboardComponent/DashboardComponent.vue";
import { useContentStore } from "../../store/contentStore";
import { useSearchStore } from "../../store/searchStore";
import { useDialogStore } from "../../store/dialogStore";
import { useAuthStore } from "../../store/authStore";
import router from "../../router";

const props = defineProps({
	filteredComponents: {
		type: Array,
		default: () => []
	}
});

const contentStore = useContentStore();
const searchStore = useSearchStore();
const dialogStore = useDialogStore();
const authStore = useAuthStore();

// 對組件去重（相同 index + city 的組合只保留一個）
const uniqueComponents = computed(() => {
	const uniqueMap = new Map();
	return props.filteredComponents.filter(component => {
		const key = `${component.city}_${component.index}`;
		if (!uniqueMap.has(key)) {
			uniqueMap.set(key, true);
			return true;
		}
		return false;
	});
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
  <div class="search-com-result">
    <!-- 1. Filtered Components -->
    <div 
      v-if="uniqueComponents?.length !== 0"
      class="dashboard"
    >
      <DashboardComponent
        v-for="item in uniqueComponents"
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
.search-com-result {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
	height: 100%;
	display: grid;
	row-gap: var(--font-s);
	column-gap: var(--font-s);
	padding: var(--font-m);
	overflow-y: auto;
	box-sizing: border-box;

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
			height: 100%;
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
