package object

import (
	"fmt"
	"strings"
)

type Vector struct {
	Name     string    `xorm:"varchar(100)" json:"name"`
	Category string    `xorm:"varchar(100)" json:"category"`
	Color    string    `xorm:"varchar(100)" json:"color"`
	Data     []float64 `xorm:"varchar(1000)" json:"data"`
}

func (vector *Vector) GetDataKey() string {
	sData := []string{}
	for _, f := range vector.Data {
		sData = append(sData, fmt.Sprintf("%f", f))
	}
	return strings.Join(sData, "|")
}
