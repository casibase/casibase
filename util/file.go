package util

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func parseJsonToFloats(s string) []float64 {
	s = strings.TrimLeft(s, "[")
	s = strings.TrimRight(s, "]")
	s = strings.ReplaceAll(s, "\n", "")

	tokens := strings.Split(s, " ")
	res := []float64{}
	for _, token := range tokens {
		if token == "" {
			continue
		}

		f := ParseFloat(token)
		res = append(res, f)
	}
	return res
}

func LoadVectorFileByCsv(path string) ([]string, [][]float64) {
	nameArray := []string{}
	dataArray := [][]float64{}

	file, err := os.Open(path)
	if err != nil {
		panic(err)
	}
	defer file.Close()

	rows := [][]string{}
	LoadCsvFile(path, &rows)

	for _, row := range rows {
		if row[0] == "" {
			continue
		}

		nameArray = append(nameArray, row[1])
		dataArray = append(dataArray, parseJsonToFloats(row[2]))
	}

	return nameArray, dataArray
}

func LoadVectorFileByCsv2(path string) ([]string, [][]float64) {
	nameArray := []string{}
	dataArray := [][]float64{}

	file, err := os.Open(path)
	if err != nil {
		panic(err)
	}
	defer file.Close()

	rows := [][]string{}
	LoadCsvFile(path, &rows)

	for _, row := range rows {
		nameArray = append(nameArray, row[0])
		dataArray = append(dataArray, StringsToFloats(row[1:]))
	}

	return nameArray, dataArray
}

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

//https://yourbasic.org/golang/formatting-byte-size-to-human-readable-format/
func GetFileSizeString(b int64) string {
	const unit = 1000
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB",
		float64(b)/float64(div), "kMGTPE"[exp])
}
