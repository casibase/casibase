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

package builtin_tool

import "context"

type contextKey string

const (
	// StoreNameKey is the context key for the store name
	StoreNameKey contextKey = "storeName"
	// StoreOwnerKey is the context key for the store owner
	StoreOwnerKey contextKey = "storeOwner"
	// LanguageKey is the context key for the language
	LanguageKey contextKey = "language"
)

// WithStoreInfo adds store information to the context
func WithStoreInfo(ctx context.Context, owner, name, lang string) context.Context {
	ctx = context.WithValue(ctx, StoreOwnerKey, owner)
	ctx = context.WithValue(ctx, StoreNameKey, name)
	ctx = context.WithValue(ctx, LanguageKey, lang)
	return ctx
}

// GetStoreInfo retrieves store information from the context
func GetStoreInfo(ctx context.Context) (owner, name, lang string, ok bool) {
	owner, okOwner := ctx.Value(StoreOwnerKey).(string)
	name, okName := ctx.Value(StoreNameKey).(string)
	lang, okLang := ctx.Value(LanguageKey).(string)
	ok = okOwner && okName && okLang
	return
}
