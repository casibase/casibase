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

func GetCurrentTime() string {
	timestamp := time.Now().Unix()
	tm := time.Unix(timestamp, 0)
	return tm.Format(time.RFC3339)
}

func GetTimeMonth(month int) string {
	currentTime := time.Now()
	res := currentTime.AddDate(0, month, 0)
	return res.Format(time.RFC3339)
}

func GetTimeDay(day int) string {
	currentTime := time.Now()
	res := currentTime.AddDate(0, 0, day)
	return res.Format(time.RFC3339)
}

func GetTimeMinute(minute int) string {
	currentTime := time.Now()
	m, _ := time.ParseDuration(strconv.Itoa(minute) + "m")
	res := currentTime.Add(m)
	return res.Format(time.RFC3339)
}

func GetTimeHour(minute int) string {
	currentTime := time.Now()
	h, _ := time.ParseDuration(strconv.Itoa(minute) + "h")
	res := currentTime.Add(h)
	return res.Format(time.RFC3339)
}

func GetDateStr() string {
	return time.Now().Format("20060102")
}
