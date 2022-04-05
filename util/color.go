package util

import (
	"image/color"
	"math"
)

func mixChannel(a uint8, b uint8, t float64) uint8 {
	i := (1-t)*float64(a)*float64(a) + t*float64(b)*float64(b)
	return uint8(math.Sqrt(i))
}

func MixColor(c1 color.RGBA, c2 color.RGBA, t float64) color.RGBA {
	res := color.RGBA{
		R: mixChannel(c1.R, c2.R, t),
		G: mixChannel(c1.G, c2.G, t),
		B: mixChannel(c1.B, c2.B, t),
	}
	return res
}
