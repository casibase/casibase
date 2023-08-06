package util

import (
	"errors"
	"math/rand"
	"sync"
	"time"
)

const (
	epoch  = int64(1577808000000) // 2020/1/1 00:00:00 UTC+8
	maxSeq = int64(4096)
)

type Snow struct {
	epoch         int64
	maxSeq        int64
	workerId      int64
	lastTimestamp int64
	sequence      int64
	mu            sync.Mutex
}

func NewSnow(workerId int64) *Snow {
	return &Snow{workerId: workerId, maxSeq: maxSeq, epoch: epoch}
}

func (s *Snow) GetSnowFlakeID() (int64, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	timestamp := time.Now().UnixNano() / 1e6 // millisecond
	if timestamp < s.lastTimestamp {
		return 0, errors.New("time error")
	}

	if timestamp == s.lastTimestamp {
		s.sequence++
		if s.sequence >= s.maxSeq {
			time.Sleep(time.Duration(rand.Intn(2)) * time.Millisecond)
			return s.GetSnowFlakeID()
		}
	} else {
		s.sequence = 0
	}

	s.lastTimestamp = timestamp

	id := (timestamp-epoch)<<22 | (s.workerId << 12) | s.sequence
	return id, nil
}
