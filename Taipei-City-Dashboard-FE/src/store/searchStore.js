import { defineStore } from "pinia";

export const useSearchStore = defineStore("search", {
	state: () => ({
		// Search keyword
		searchKeyword: "",
		// Loading state
		isSearching: false,
		// Selected topic indexes
		selectedTopics: [],
		// Selected department names  
		selectedDepartments: [],
		// Selected city (single selection)
		selectedCity: "",
		// Search offcanvas visibility
		searchOffcanvas: false,
	}),
	
	getters: {
		// Get search parameters for API calls
		searchParams: (state) => {
			const {selectedDepartments} = state;
				
			return {
				keyword: state.searchKeyword,
				topics: state.selectedTopics,
				departments: selectedDepartments,
				city: state.selectedCity
			};
		}
	},
	
	actions: {
		// Set search keyword
		setSearchKeyword(keyword) {
			this.searchKeyword = keyword;
		},
		
		// Toggle topic selection by index
		toggleTopic(topicIndex) {
			const index = this.selectedTopics.indexOf(topicIndex);
			if (index > -1) {
				this.selectedTopics.splice(index, 1);
			} else {
				this.selectedTopics.push(topicIndex);
			}
		},
		
		// Toggle department selection
		toggleDepartment(departmentName) {
			const index = this.selectedDepartments.indexOf(departmentName);
			if (index > -1) {
				this.selectedDepartments.splice(index, 1);
			} else {
				this.selectedDepartments.push(departmentName);
			}
		},
		
		// Set selected city (single selection)
		setSelectedCity(cityValue) {
			this.selectedCity = cityValue;
			// 清空先前的選擇
			this.selectedTopics = [];
			this.selectedDepartments = [];
		},
		
		// Remove selected item
		removeSelectedItem(item) {
			if (item.type === "topic") {
				const index = this.selectedTopics.indexOf(item.id);
				if (index > -1) {
					this.selectedTopics.splice(index, 1);
				}
			} else if (item.type === "department") {
				const index = this.selectedDepartments.indexOf(item.name);
				if (index > -1) {
					this.selectedDepartments.splice(index, 1);
				}
			}
		},
		
		// Clear all filters
		clearAllFilters() {
			this.selectedTopics = [];
			this.selectedDepartments = [];
			this.selectedCity = "";
			this.searchKeyword = "";
		},
		
		// Perform search
		async performSearch() {
			this.isSearching = true;
			
			try {
				// 模擬搜尋延遲
				await new Promise(resolve => setTimeout(resolve, 500));
				
				// 實際的搜尋邏輯會在 SearchResultView 中的 computed 中處理
				// 這裡只是設定搜尋狀態
				
			} catch (error) {
				console.error("Search error:", error);
			} finally {
				this.isSearching = false;
			}
		},
	}
}); 
