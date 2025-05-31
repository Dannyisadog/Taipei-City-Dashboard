<script setup>
import { ref } from "vue";
import SearchComResult from "../components/search/SearchComResult.vue";
import SearchMapResult from "../components/search/SearchMapResult.vue";
import MoreInfo from "../components/dialogs/MoreInfo.vue";
import ReportIssue from "../components/dialogs/ReportIssue.vue";
import router from "../router";

// Tab 切換狀態
const activeTab = ref('components');

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
        <SearchComResult />
      </div>

      <!-- Map Tab -->
      <div
        v-if="activeTab === 'map'"
        class="tab-content map-view"
      >
        <SearchMapResult />
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
}

.tab-content {
  height: 100%;
  width: 100%;
  position: relative;
  box-sizing: border-box;
  
  &.map-view {
    height: calc(100vh - 200px);
    height: calc(var(--vh) * 100 - 200px);
    margin: 0;
    padding: 0;
  }
}
</style>

