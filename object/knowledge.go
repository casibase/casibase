package object

import (
	"context"
	"fmt"
	"github.com/casbin/casibase/ai"
	"github.com/casbin/casibase/storage"
	"github.com/casbin/casibase/util"
	"golang.org/x/time/rate"
	"io"
	"strings"
	"time"
)

func isTxtObject(key string) bool {
	return strings.HasSuffix(key, ".txt")
}

func getTxtObjects(files []*storage.Object) []*storage.Object {
	var txtObjects []*storage.Object
	for _, file := range files {
		if isTxtObject(file.Key) {
			txtObjects = append(txtObjects, file)
		}
	}

	return txtObjects
}

func GetTxtObjects(provider string, prefix string) ([]*storage.Object, error) {
	files, err := storage.ListObjects(provider, prefix)
	if err != nil {
		return nil, err
	}

	return getTxtObjects(files), nil
}

func getObjectReadCloser(object *storage.Object) (io.ReadCloser, error) {
	readCloser, err := storage.GetObjectReadCloser(object)
	if err != nil {
		return nil, err
	}

	return readCloser, nil
}

func setSplitTxtVector(authToken string, splitTxt string, storeName string, fileName string) (bool, error) {
	vector := ai.GetEmbeddingSafe(authToken, []string{splitTxt})
	if vector == nil {
		return false, nil
	}
	vectorFloat64 := VectorFloat32ToFloat64(vector)

	newName := fmt.Sprintf("vector_%s", util.GetRandomName())

	newVector := &Vector{
		Owner:       "admin",
		Name:        newName,
		CreatedTime: util.GetCurrentTime(),
		DisplayName: newName,
		Store:       storeName,
		File:        fileName,
		Text:        splitTxt,
		Data:        vectorFloat64,
	}

	success, err := AddVector(newVector)
	if err != nil {
		return false, err
	}
	if !success {
		return false, nil
	}
	return true, nil
}

func setTxtObjectVector(authToken string, provider string, key string, storeName string) (bool, error) {
	lb := rate.NewLimiter(rate.Every(time.Minute), 3)

	txtObjects, err := GetTxtObjects(provider, key)
	if err != nil {
		return false, err
	}
	if len(txtObjects) == 0 {
		return false, nil
	}

	for _, txtObject := range txtObjects {
		readCloser, err := getObjectReadCloser(txtObject)
		if err != nil {
			return false, err
		}
		defer readCloser.Close()

		splitTxts := ai.GetSplitTxt(readCloser)
		for _, splitTxt := range splitTxts {
			if lb.Allow() {
				success, err := setSplitTxtVector(authToken, splitTxt, storeName, txtObject.Key)
				if err != nil {
					return false, err
				}
				if !success {
					return false, nil
				}
			} else {
				err := lb.Wait(context.Background())
				if err != nil {
					return false, err
				}
				success, err := setSplitTxtVector(authToken, splitTxt, storeName, txtObject.Key)
				if err != nil {
					return false, err
				}
				if !success {
					return false, nil
				}
			}
		}
	}

	return true, nil
}
