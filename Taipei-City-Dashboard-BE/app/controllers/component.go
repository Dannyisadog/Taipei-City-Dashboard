package controllers

import (
	"net/http"

	"TaipeiCityDashboardBE/app/models"
	"github.com/gin-gonic/gin"
)

// GetDistinctSources returns all distinct sources from component_charts table
func GetDistinctSources(c *gin.Context) {
	sources, err := models.GetDistinctSources()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sources)
} 