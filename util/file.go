package util

import (
	"bufio"
	"os"
	"strings"
)

func LoadSpaceFile(path string, rows *[][]string) {
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
		line := scanner.Text()

		line = strings.Trim(line, " ")
		tokens := strings.Split(line, " ")
		*rows = append(*rows, tokens)

		i += 1
	}

	if err = scanner.Err(); err != nil {
		panic(err)
	}
}
