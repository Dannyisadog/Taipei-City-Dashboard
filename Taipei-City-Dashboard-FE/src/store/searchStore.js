import { defineStore } from "pinia";
import http from "../router/axios";
import { useContentStore } from "./contentStore";

export const useSearchStore = defineStore("search", {
	state: () => ({
		// All topics
		allTopics: [],
		// All source
		allSource: [],
		// Loading state
		isSearching: false,
		// Selected topic names (strings)
		selectedTopics: [],
		// Selected department names  
		selectedDepartments: [],
		// Selected cities (multiple selection)
		selectedCities: [],
		// Has map data filter
		selectedMapData: false,
		// Search offcanvas visibility
		searchOffcanvas: false,
	}),
	
	getters: {
		// Get search parameters for API calls
		searchParams() {
			return {
				topics: this.selectedTopics,
				departments: this.selectedDepartments,
				cities: this.selectedCities,
				mapData: this.selectedMapData
			}
		}
	},
	
	actions: {
		async setupAllSource() {
			const response = await http.get(`/component/sources`);
			this.allSource = [...new Set(response.data)];
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

		async getAllSearchComponents() {
			const contentStore = useContentStore();
			
			const topicsToSearch = this.selectedTopics.length > 0 ? this.selectedTopics : this.allTopics;
			const citiesToSearch = this.selectedCities.length > 0 ? this.selectedCities : Array.from(contentStore.dashboards.keys());
			
			const targetIndices = [];
			
			// 遍歷選中的城市
			citiesToSearch.forEach(city => {
				const cityDashboards = contentStore.dashboards.get(city);
				if (cityDashboards) {
					cityDashboards.forEach(dashboard => {
						if (topicsToSearch.includes(dashboard.name)) {
							targetIndices.push(dashboard.index);
						}
					});
				}
			});
			
			const uniqueIndices = [...new Set(targetIndices)];
			
			const promises = uniqueIndices.map(index => 
				http.get(`/dashboard/${index}`)
			);
			const results = await Promise.all(promises);
			
			// 從返回的結果中過濾出符合選中城市的組件
			const allComponents = results.flatMap(response => response.data.data);
			
			// 如果有選擇特定城市，則過濾組件
			if (this.selectedCities.length > 0) {
				return allComponents.filter(component => 
					this.selectedCities.includes(component.city)
				);
			}
			
			return allComponents;
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

		// Toggle city selection
		toggleCity(cityValue) {
			const index = this.selectedCities.indexOf(cityValue);
			if (index > -1) {
				this.selectedCities.splice(index, 1);
			} else {
				this.selectedCities.push(cityValue);
			}
		},

		// Toggle map data selection
		toggleMapData() {
			this.selectedMapData = !this.selectedMapData;
		},

		// 清空所有選擇
		clearAllFilters() {
			this.selectedTopics = [];
			this.selectedDepartments = [];
			this.selectedCities = [];
			this.selectedMapData = false;
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
			} else if (item.type === "city") {
				const index = this.selectedCities.indexOf(item.id);
				if (index > -1) {
					this.selectedCities.splice(index, 1);
				}
			} else if (item.type === "mapData") {
				this.selectedMapData = false;
			}
		},
	}
}); 
