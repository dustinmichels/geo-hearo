package main

import (
	"net/http"

	"github.com/dustinmichels/geo-hearo/api"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	r.GET("/places", func(c *gin.Context) {
		places := api.GetPlaces()
		c.JSON(http.StatusOK, places)
	})

	r.GET("/page", func(c *gin.Context) {
		placeId := "T1pGvdXZ"
		page := api.GetPage(placeId)
		c.JSON(http.StatusOK, page)
	})

	r.Run() // listen and serve on 0.0.0.0:8080 (for windows "localhost:8080")
}
