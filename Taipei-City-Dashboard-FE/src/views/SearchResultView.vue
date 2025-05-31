<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const handleGoBack = () => {
	router.push('/dashboard');
};
</script>

<template>
  <div class="search-result">
    <!-- Header -->
    <div class="search-result-header">
      <button 
        class="search-result-back"
        @click="handleGoBack"
      >
        <span>chevron_left</span>
        返回儀表板總覽
      </button>
      <h2 class="search-result-header-title">
        搜尋結果
      </h2>
    </div>

    <div class="search-result-divider" />

    <!-- Empty content area for future implementation -->
    <div class="search-result-content">
      <!-- Content will be implemented later -->
      <div v-if="false" />
      <div
        v-else
        class="search-result-content-empty"
      >
        <p class="search-result-content-text">
          找不到您想搜尋的資料。換個關鍵字或利用進階搜尋試試？
        </p>
        <button
          class="search-result-advanced-search-btn"
        >
          進階搜尋
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.search-result {
  width: 100%;
  height: calc(var(--vh) * 100);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &-header {
    display: flex;
    align-items: center;
    position: relative;
    padding: 30px 20px;

    &-title {
      color: var(--color-normal-text);
      font-size: var(--font-l);
      font-weight: 700;
      margin: 0;
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
    }
  }

  &-back {
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    color: var(--color-normal-text);
    font-size: 14px;
    cursor: pointer;

    span {
      font-family: var(--font-icon);
      font-size: calc(var(--font-xl) * var(--font-to-icon));
    }
  }

  &-divider {
    width: 100%;
    height: 1px;
    background-color: var(--color-border);
  }

  &-content {
	flex: 1;
	height: 100%;
	padding: 20px 45px;
	display: flex;
	justify-content: center;
	align-items: center;
	text-align: center;
    overflow: hidden;

	&-text {
		font-size: var(--font-l);
		margin: 0;
	}

	&-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 170px;
	}
  }

  &-advanced-search-btn {
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
      transform: translateY(-1px);
    }
  }
}
</style>
