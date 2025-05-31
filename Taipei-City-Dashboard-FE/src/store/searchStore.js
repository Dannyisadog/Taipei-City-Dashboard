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
		searchParams() {
			return {
				keyword: this.searchKeyword,
				topics: this.selectedTopics,
				departments: this.selectedDepartments,
				city: this.selectedCity
			}
		}
	},
	
	actions: {
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

		async getAllSearchComponents() {
			const contentStore = useContentStore();
			
			const topicsToSearch = this.selectedTopics.length > 0 ? this.selectedTopics : this.allTopics;
			
			const targetIndices = [];
			
			const currnetDashboard = contentStore.dashboards.get(this.selectedCity);
			if (currnetDashboard == null) return []

			currnetDashboard.forEach(dashboard => {
				if (topicsToSearch.includes(dashboard.name)) {
					targetIndices.push(dashboard.index);
				}
			});
			
			const uniqueIndices = [...new Set(targetIndices)];
			
			const promises = uniqueIndices.map(index => 
				http.get(`/dashboard/${index}`)
			);
			const results = await Promise.all(promises);
			return results.flatMap(response => response.data.data);
		},

		// open search offcanvas
		openSearchOffcanvas() {
			this.searchOffcanvas = true;
		},

		// close search offcanvas
		closeSearchOffcanvas() {
			this.searchOffcanvas = false;
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

		// 清空關鍵字
		clearSearchKeyword() {
			this.searchKeyword = "";
		},

		// 清空所有選擇
		clearAllFilters() {
			this.selectedTopics = [];
			this.selectedDepartments = [];
			this.selectedCity = "";
		},
		
		// 設定選擇的城市
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
	}
}); 
