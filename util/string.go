package util

import (
	"errors"
	"fmt"
	"io/ioutil"
	"strconv"
	"strings"
)

func IndexAt(s, sep string, n int) int {
	idx := strings.Index(s[n:], sep)
	if idx > -1 {
		idx += n
	}
	return idx
}

func ParseInt(s string) int {
	i, err := strconv.Atoi(s)
	if err != nil {
		panic(err)
	}

	return i
}

func ParseIntWithError(s string) (int, error) {
	i, err := strconv.Atoi(s)
	if err != nil {
		return -1, err
	}

	if i < 0 {
		return -1, errors.New("negative version number")
	}

	return i, nil
}

func ParseFloat(s string) float64 {
	f, err := strconv.ParseFloat(s, 64)
	if err != nil {
		panic(err)
	}

	return f
}

func GetOwnerAndNameFromId(id string) (string, string) {
	tokens := strings.Split(id, "/")
	if len(tokens) != 2 {
		panic(errors.New("GetOwnerAndNameFromId() error, wrong token count for ID: " + id))
	}

	return tokens[0], tokens[1]
}

func GetOwnerAndNameFromId3(id string) (string, string, string) {
	tokens := strings.Split(id, "/")
	if len(tokens) != 3 {
		panic(errors.New("GetOwnerAndNameFromId3() error, wrong token count for ID: " + id))
	}

	return tokens[0], fmt.Sprintf("%s/%s", tokens[0], tokens[1]), tokens[2]
}

func GetOwnerAndNameFromId3New(id string) (string, string, string) {
	tokens := strings.Split(id, "/")
	if len(tokens) != 3 {
		panic(errors.New("GetOwnerAndNameFromId3New() error, wrong token count for ID: " + id))
	}

	return tokens[0], tokens[1], tokens[2]
}

func GetIdFromOwnerAndName(owner string, name string) string {
	return fmt.Sprintf("%s/%s", owner, name)
}

func ReadStringFromPath(path string) string {
	data, err := ioutil.ReadFile(path)
	if err != nil {
		panic(err)
	}

	return string(data)
}

func WriteStringToPath(s string, path string) {
	err := ioutil.WriteFile(path, []byte(s), 0644)
	if err != nil {
		panic(err)
	}
}

func ReadBytesFromPath(path string) []byte {
	data, err := ioutil.ReadFile(path)
	if err != nil {
		panic(err)
	}

	return data
}

func WriteBytesToPath(b []byte, path string) {
	err := ioutil.WriteFile(path, b, 0644)
	if err != nil {
		panic(err)
	}
}
