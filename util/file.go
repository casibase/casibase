package util

import (
	"bufio"
	"os"
	"strings"
)

func LoadVectorFileBySpace(path string) ([]string, [][]float64) {
	nameArray := []string{}
	dataArray := [][]float64{}

	file, err := os.Open(path)
	if err != nil {
		panic(err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	const maxCapacity = 1024 * 1024 * 8
	buf := make([]byte, maxCapacity)
	scanner.Buffer(buf, maxCapacity)
	i := 0
	for scanner.Scan() {
		if i == 0 {
			i += 1
			continue
		}

		line := scanner.Text()

		line = strings.Trim(line, " ")
		tokens := strings.Split(line, " ")
		nameArray = append(nameArray, tokens[0])

		data := []float64{}
		for j := 1; j < len(tokens); j++ {
			data = append(data, ParseFloat(tokens[j]))
		}
		dataArray = append(dataArray, data)

		i += 1
	}

	if err = scanner.Err(); err != nil {
		panic(err)
	}

	return nameArray, dataArray
}
