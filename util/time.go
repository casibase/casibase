// Copyright 2020 The casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package util

import (
	"strconv"
	"time"
)

// GetCurrentTime returns formatted current time.
func GetCurrentTime() string {
	timestamp := time.Now().Unix()
	tm := time.Unix(timestamp, 0)
	return tm.Format(time.RFC3339)
}

func GetTimeFromTimestamp(stamp int64) string {
	t := time.Unix(stamp, 0)
	return t.Format(time.RFC3339)
}

func Time2String(t time.Time) string {
	// https://stackoverflow.com/questions/55409774/the-result-of-time-formatting-of-rfc3339-in-go-on-linux-and-macos-are-different
	lo, _ := time.LoadLocation("Local")
	return t.In(lo).Format(time.RFC3339)
}

// GetTimeMonth returns the time after the specified duration(month).
func GetTimeMonth(month int) string {
	currentTime := time.Now()
	res := currentTime.AddDate(0, month, 0)
	return res.Format(time.RFC3339)
}

// GetTimeDay returns the time after the specified duration(day).
func GetTimeDay(day int) string {
	currentTime := time.Now()
	res := currentTime.AddDate(0, 0, day)
	return res.Format(time.RFC3339)
}

// GetTimeMinute returns the time after the specified duration(minute).
func GetTimeMinute(minute int) string {
	currentTime := time.Now()
	m, _ := time.ParseDuration(strconv.Itoa(minute) + "m")
	res := currentTime.Add(m)
	return res.Format(time.RFC3339)
}

// GetTimeHour returns the time after the specified duration(hour).
func GetTimeHour(hour int) string {
	currentTime := time.Now()
	h, _ := time.ParseDuration(strconv.Itoa(hour) + "h")
	res := currentTime.Add(h)
	return res.Format(time.RFC3339)
}

// GetTimeYear returns the time after the specified duration(year).
func GetTimeYear(year int) string {
	currentTime := time.Now()
	res := currentTime.AddDate(year, 0, 0)
	return res.Format(time.RFC3339)
}

// GetDateStr returns formatted current time with the year, month and day.
func GetDateStr() string {
	return time.Now().Format("20060102")
}
