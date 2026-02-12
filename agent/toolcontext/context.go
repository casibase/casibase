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

package toolcontext

import (
	"context"
	"io"
)

type contextKey string

const (
	// StoreNameKey is the context key for the store name
	StoreNameKey contextKey = "storeName"
	// StoreOwnerKey is the context key for the store owner
	StoreOwnerKey contextKey = "storeOwner"
	// LanguageKey is the context key for the language
	LanguageKey contextKey = "language"
	// ImageGeneratorKey is the context key for the image generator function
	ImageGeneratorKey contextKey = "imageGenerator"
)

// ImageGeneratorFunc is a function type that generates images
// It takes a prompt, writer, and language, and returns the HTML output and any error
type ImageGeneratorFunc func(prompt string, writer io.Writer, lang string) (string, error)

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

// WithImageGenerator adds an image generator function to the context
func WithImageGenerator(ctx context.Context, generator ImageGeneratorFunc) context.Context {
	return context.WithValue(ctx, ImageGeneratorKey, generator)
}

// GetImageGenerator retrieves the image generator function from the context
func GetImageGenerator(ctx context.Context) (ImageGeneratorFunc, bool) {
	generator, ok := ctx.Value(ImageGeneratorKey).(ImageGeneratorFunc)
	return generator, ok
}
