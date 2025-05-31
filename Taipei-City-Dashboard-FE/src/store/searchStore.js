import { defineStore } from "pinia";
import { useContentStore } from "./contentStore";

export const useSearchStore = defineStore("search", {
	state: () => ({
		// Search keyword
		searchKeyword: "",
		// Loading state
		isSearching: false,
		// Selected topic names
		selectedTopics: [],
		// Selected department names  
		selectedDepartments: [],
		// Search offcanvas visibility
		searchOffcanvas: false,
	}),
	
	getters: {
		// Get all selected items for display
		selectedItems: (state) => {
			const items = [];
			
			// Add selected topics
			state.selectedTopics.forEach(topicName => {
				items.push({ 
					type: "topic", 
					id: topicName, 
					name: topicName 
				});
			});
			
			// Add selected departments
			state.selectedDepartments.forEach(departmentName => {
				items.push({ 
					type: "department", 
					id: departmentName, 
					name: departmentName 
				});
			});
			
			return items;
		},
		// Get search parameters for API calls
		searchParams: (state) => {
			const {selectedDepartments} = state;
				
			return {
				keyword: state.searchKeyword,
				topics: state.selectedTopics,
				departments: selectedDepartments
			};
		}
	},
	
	actions: {
		// Set search keyword
		setSearchKeyword(keyword) {
			this.searchKeyword = keyword;
		},
		
		// Toggle topic selection
		toggleTopic(topicName) {
			const index = this.selectedTopics.indexOf(topicName);
			if (index > -1) {
				this.selectedTopics.splice(index, 1);
			} else {
				this.selectedTopics.push(topicName);
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
		
		// Remove selected item
		removeSelectedItem(item) {
			if (item.type === "topic") {
				const index = this.selectedTopics.indexOf(item.name);
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
			this.searchKeyword = "";
		},
		
		// Perform search
		async performSearch() {
			// TODO: Implement search logic
		},
	}
}); 
