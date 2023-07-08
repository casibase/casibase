package storage

import "testing"

func TestStorage(t *testing.T) {
	_, err := ListObjects("casibase", "")
	if err != nil {
		panic(err)
	}
}
