package storage

import (
	"io"
	"time"
)

type Storage interface {
	Get(key string) (io.ReadCloser, error)
	Put(user, key string, bytes []byte) error
	Delete(key string) error
	List(prefix string) ([]*Object, error)
}

type Object struct {
	Key          string
	LastModified *time.Time
	Storage      Storage
}

func NewStorageProvider(provider string) Storage {
	switch provider {
	case "casdoor":
		return NewCasdoorStorage()
	default:
		return nil
	}
}
