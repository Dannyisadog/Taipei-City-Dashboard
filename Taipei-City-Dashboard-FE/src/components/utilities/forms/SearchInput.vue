<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSearchStore } from "../../../store/searchStore";

const route = useRoute();
const router = useRouter();

const searchStore = useSearchStore();

const searchValue = computed({
	get() {
		return searchStore.searchKeyword;
	},
	set(value) {
		searchStore.setSearchKeyword(value);
	}
});

const canAdvanceSearch = computed(() =>  route.name === 'dashboard');

const handleClear = () => {
	searchStore.setSearchKeyword("");
};

const handleKeyPress = (event) => {
	if (event.key === "Enter") {
		searchStore.performSearch();
		router.push("/search-result");
	}
};
</script>

<template>
  <div class="search-input">
    <div class="search-input-container">
      <!-- Search icon -->
      <div class="search-input-icon">
        <span>search</span>
      </div>
      
      <!-- Input field -->
      <input
        v-model="searchValue"
        type="text"
        placeholder="搜尋關鍵字"
        class="search-input-field"
        @keypress="handleKeyPress"
      >

      <!-- Clear button -->
      <button
        v-if="searchValue.length > 0"
        class="search-input-clear"
        @click="handleClear"
      >
        <span>clear</span>
      </button>
      
      <!-- Search button -->
      <button
        class="search-input-button"
        :disabled="!canAdvanceSearch"
        @click="searchStore.searchOffcanvas = true"
      >
        <span>tune</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.search-input {
	width: 240px;
	height: 30px;
	border-radius: 4px;
	margin-right: var(--font-m);

	&-container {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
		height: 100%;
		background-color: var(--color-complement-text);
		border-radius: 4px;
		overflow: hidden;
	}

	&-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: 7px;
		height: 100%;
		color: var(--color-normal-text);

		span {
			font-family: var(--font-icon);
			font-size: calc(var(--font-ms) * var(--font-to-icon));
		}
	}

	&-field {
		flex: 1;
		height: 100%;
		padding: 0 8px;
		border: none;
		background-color: transparent;
		color: var(--color-normal-text);
		font-size: 12px;
		outline: none;

		&::placeholder {
			color: var(--color-normal-text);
		}

		&:focus {
			border: none;
		}
	}

	&-clear {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		margin-right: 8px;
		background-color: transparent;
		border: none;
		border-radius: 50%;
		color: var(--color-normal-text);
		cursor: pointer;
		transition: background-color 0.2s ease;

		span {
			font-family: var(--font-icon);
			font-size: calc(var(--font-ms) * var(--font-to-icon));
		}
	}

	&-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 100%;
		background-color: var(--color-background);
		border: none;
		border-radius: 0 4px 4px 0;
		color: var(--color-normal-text);
		cursor: pointer;
		transition: background-color 0.2s ease;

		&:disabled {
			cursor: not-allowed;
			opacity: 0.5;
		}

		span {
			font-family: var(--font-icon);
			font-size: calc(var(--font-ms) * var(--font-to-icon));
		}
	}
}
</style> 
