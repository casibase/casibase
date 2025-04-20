// Copyright 2025 The Casibase Authors. All Rights Reserved.
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

package stt

import "math"

// getPrice calculates the price based on audio duration and hourly rate
func getPrice(durationSeconds float64, pricePerHour float64) float64 {
	// Convert seconds to hours
	durationHours := durationSeconds / 3600.0
	price := durationHours * pricePerHour
	price = math.Round(price*1e8) / 1e8
	return price
}
