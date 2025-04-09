// Copyright 2023 The Casibase Authors. All Rights Reserved.
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

package routers

import (
	"fmt"
	"github.com/beego/beego/context"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
	"strings"
	"time"
)

func recordSystemInfo(systemInfo *util.SystemInfo) {
	for i, value := range systemInfo.CpuUsage {
		object.CpuUsage.WithLabelValues(fmt.Sprintf("%d", i)).Set(value)
	}
	object.MemoryUsage.WithLabelValues("memoryUsed").Set(float64(systemInfo.MemoryUsed))
	object.MemoryUsage.WithLabelValues("memoryTotal").Set(float64(systemInfo.MemoryTotal))
}

func PrometheusFilter(ctx *context.Context) {
	method := ctx.Input.Method()
	path := ctx.Input.URL()
	if strings.HasPrefix(path, "/api/metrics") {
		systemInfo, err := util.GetSystemInfo()
		if err == nil {
			recordSystemInfo(systemInfo)
		}
		return
	}

	if strings.HasPrefix(path, "/api") {
		ctx.Input.SetData("startTime", time.Now())
		object.TotalThroughput.Inc()
		object.ApiThroughput.WithLabelValues(path, method).Inc()
	}
}
