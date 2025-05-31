import { defineStore } from "pinia";
import http from "../router/axios";
import { useContentStore } from "./contentStore";

export const useSearchStore = defineStore("search", {
	state: () => ({
		// All topics
		allTopics: [],
		// All source
		allSource: [],
		// Search keyword
		searchKeyword: "",
		// Loading state
		isSearching: false,
		// Selected topic names (strings)
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
		/* Utility functions to access loading and error states in contentStore */
		setLoading(state) {
			const contentStore = useContentStore();
			contentStore.loading = state ? true : false;
		},
		async setupAllSource() {
			const response = await http.get(`/component/`);
			const sources = response.data.data.map(item => item.source).filter(Boolean);
			this.allSource = [...new Set(sources)];
		},
		setupAllTopics() {
			const contentStore = useContentStore();
			if (!contentStore.dashboards || contentStore.dashboards.size === 0) {
				return;
			}
			
			const allTopicNames = new Set();
			Array.from(contentStore.dashboards.values()).forEach((dashboards) => {
				dashboards.forEach(dashboard => {
					if (dashboard.name) {
						allTopicNames.add(dashboard.name);
					}
				});
			});
			this.allTopics = [...allTopicNames];
		},

		// Set search keyword
		setSearchKeyword(keyword) {
			this.searchKeyword = keyword;
		},
		
		// Toggle topic selection by name
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
			this.selectedCity = "";
			this.searchKeyword = "";
		},
	}
}); 
