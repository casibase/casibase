// Copyright 2023 The OpenAgent Authors. All Rights Reserved.
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

package txt

import (
	"bytes"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"math"
	"os"
	"sort"
	"strings"
	"unicode"
	"unicode/utf16"
	"unicode/utf8"

	"github.com/casibase/pdf"
	"github.com/pdfcpu/pdfcpu/pkg/api"
	"golang.org/x/text/encoding/simplifiedchinese"
)

type pdfMatrix [6]float64

var pdfIdentity = pdfMatrix{1, 0, 0, 1, 0, 0}

func (m pdfMatrix) mul(n pdfMatrix) pdfMatrix {
	return pdfMatrix{
		m[0]*n[0] + m[1]*n[2],
		m[0]*n[1] + m[1]*n[3],
		m[2]*n[0] + m[3]*n[2],
		m[2]*n[1] + m[3]*n[3],
		m[4]*n[0] + m[5]*n[2] + n[4],
		m[4]*n[1] + m[5]*n[3] + n[5],
	}
}

func getPdfMatrix(args []pdf.Value) pdfMatrix {
	var m pdfMatrix
	for i := range m {
		m[i] = args[i].Float64()
	}
	return m
}

func getPdfPanicError(r interface{}) error {
	switch x := r.(type) {
	case string:
		return errors.New(x)
	case error:
		return x
	default:
		return errors.New(fmt.Sprint(x))
	}
}

type pdfGlyph struct {
	y    float64
	size float64
	text string
}

type pdfGraphicsState struct {
	ctm    pdfMatrix
	tl     float64
	tfs    float64
	decode func(string) string
}

type pdfTextExtractor struct {
	glyphs []pdfGlyph
	err    error
}

func (e *pdfTextExtractor) run(content pdf.Value, resources pdf.Value, ctm pdfMatrix, depth int) {
	defer func() {
		if r := recover(); r != nil && e.err == nil {
			e.err = getPdfPanicError(r)
		}
	}()

	g := pdfGraphicsState{ctm: ctm, decode: func(string) string { return "" }}
	var stack []pdfGraphicsState
	tm, tlm := pdfIdentity, pdfIdentity
	decoders := map[string]func(string) string{}

	decode := func(raw string) string {
		return strings.Map(func(r rune) rune {
			if unicode.Is(unicode.Co, r) {
				return -1
			}
			return r
		}, g.decode(raw))
	}
	show := func(text string) {
		if text == "" {
			return
		}
		trm := tm.mul(g.ctm)
		e.glyphs = append(e.glyphs, pdfGlyph{y: trm[5], size: math.Abs(g.tfs) * math.Hypot(trm[2], trm[3]), text: text})
	}
	moveLine := func(tx float64, ty float64) {
		tlm = pdfMatrix{1, 0, 0, 1, tx, ty}.mul(tlm)
		tm = tlm
	}

	pdf.Interpret(content, func(stk *pdf.Stack, op string) {
		n := stk.Len()
		args := make([]pdf.Value, n)
		for i := n - 1; i >= 0; i-- {
			args[i] = stk.Pop()
		}

		switch op {
		case "q":
			stack = append(stack, g)
		case "Q":
			if len(stack) > 0 {
				g = stack[len(stack)-1]
				stack = stack[:len(stack)-1]
			}
		case "cm":
			if n == 6 {
				g.ctm = getPdfMatrix(args).mul(g.ctm)
			}
		case "BT":
			tm, tlm = pdfIdentity, pdfIdentity
		case "Tm":
			if n == 6 {
				tlm = getPdfMatrix(args)
				tm = tlm
			}
		case "Td":
			if n == 2 {
				moveLine(args[0].Float64(), args[1].Float64())
			}
		case "TD":
			if n == 2 {
				g.tl = -args[1].Float64()
				moveLine(args[0].Float64(), args[1].Float64())
			}
		case "TL":
			if n == 1 {
				g.tl = args[0].Float64()
			}
		case "T*":
			moveLine(0, -g.tl)
		case "Tf":
			if n == 2 {
				name := args[0].Name()
				decode, ok := decoders[name]
				if !ok {
					decode = getPdfFontDecoder(resources.Key("Font").Key(name))
					decoders[name] = decode
				}
				g.decode = decode
				g.tfs = args[1].Float64()
			}
		case "Tj":
			if n == 1 {
				show(decode(args[0].RawString()))
			}
		case "'":
			if n == 1 {
				moveLine(0, -g.tl)
				show(decode(args[0].RawString()))
			}
		case "\"":
			if n == 3 {
				moveLine(0, -g.tl)
				show(decode(args[2].RawString()))
			}
		case "TJ":
			if n == 1 {
				var sb strings.Builder
				gap := false
				for i := 0; i < args[0].Len(); i++ {
					x := args[0].Index(i)
					if x.Kind() != pdf.String {
						gap = gap || x.Float64() < -200
						continue
					}
					text := decode(x.RawString())
					if text == "" {
						continue
					}
					if gap && sb.Len() > 0 {
						last, _ := utf8.DecodeLastRuneInString(sb.String())
						first, _ := utf8.DecodeRuneInString(text)
						if last < 0x2e80 && first < 0x2e80 && !unicode.IsSpace(last) && !unicode.IsSpace(first) {
							sb.WriteString(" ")
						}
					}
					sb.WriteString(text)
					gap = false
				}
				show(sb.String())
			}
		case "Do":
			if n == 1 && depth < 8 {
				xobject := resources.Key("XObject").Key(args[0].Name())
				if xobject.Key("Subtype").Name() != "Form" {
					return
				}
				m := pdfIdentity
				if matrix := xobject.Key("Matrix"); matrix.Len() == 6 {
					for i := range m {
						m[i] = matrix.Index(i).Float64()
					}
				}
				xresources := xobject.Key("Resources")
				if xresources.IsNull() {
					xresources = resources
				}
				e.run(xobject, xresources, m.mul(g.ctm), depth+1)
			}
		}
	})
}

func getPdfFontDecoder(font pdf.Value) (decode func(string) string) {
	defer func() {
		if recover() != nil {
			decode = func(string) string { return "" }
		}
	}()

	if toUnicode := font.Key("ToUnicode"); toUnicode.Kind() == pdf.Stream {
		if m := readPdfCmap(toUnicode); m != nil {
			return m.decode
		}
	}

	encoding := font.Key("Encoding")
	if font.Key("Subtype").Name() == "Type0" {
		name := encoding.Name()
		switch {
		case strings.HasPrefix(name, "GB"):
			return decodePdfGbk
		case strings.HasPrefix(name, "Uni") && (strings.Contains(name, "UCS2") || strings.Contains(name, "UTF16")):
			return decodePdfUtf16
		}
		return func(string) string { return "" }
	}

	encoder := pdf.Font{V: font}.Encoder()
	hasDifferences := encoding.Kind() == pdf.Dict
	return func(raw string) string {
		if !hasDifferences {
			if text, ok := decodePdfGbkText(raw); ok {
				return text
			}
		}
		return encoder.Decode(raw)
	}
}

func decodePdfGbk(raw string) string {
	text, err := simplifiedchinese.GBK.NewDecoder().String(raw)
	if err != nil {
		return ""
	}
	return text
}

func decodePdfGbkText(raw string) (string, bool) {
	if !strings.ContainsFunc(raw, func(r rune) bool { return r >= 0x80 }) {
		return "", false
	}

	text := decodePdfGbk(raw)
	if text == "" || strings.ContainsRune(text, utf8.RuneError) {
		return "", false
	}
	if !strings.ContainsFunc(text, func(r rune) bool { return unicode.Is(unicode.Han, r) }) {
		return "", false
	}
	return text, true
}

func decodePdfUtf16(raw string) string {
	u := make([]uint16, len(raw)/2)
	for i := range u {
		u[i] = uint16(raw[2*i])<<8 | uint16(raw[2*i+1])
	}
	return string(utf16.Decode(u))
}

type pdfCmapToken struct {
	value string
	hex   bool
}

func tokenizePdfCmap(data []byte) []pdfCmapToken {
	const delimiters = " \t\r\n\f\x00[]<>()/%"
	var tokens []pdfCmapToken
	for i := 0; i < len(data); {
		c := data[i]
		switch {
		case c == '%':
			for i < len(data) && data[i] != '\n' && data[i] != '\r' {
				i++
			}
		case (c == '<' || c == '>') && i+1 < len(data) && data[i+1] == c:
			tokens = append(tokens, pdfCmapToken{value: string(data[i : i+2])})
			i += 2
		case c == '<':
			end := bytes.IndexByte(data[i:], '>')
			if end < 0 {
				return tokens
			}
			hexText := strings.Join(strings.Fields(string(data[i+1:i+end])), "")
			if len(hexText)%2 == 1 {
				hexText += "0"
			}
			b, err := hex.DecodeString(hexText)
			if err != nil {
				tokens = append(tokens, pdfCmapToken{value: "<>"})
			} else {
				tokens = append(tokens, pdfCmapToken{value: string(b), hex: true})
			}
			i += end + 1
		case c == '[' || c == ']':
			tokens = append(tokens, pdfCmapToken{value: string(c)})
			i++
		case strings.IndexByte(" \t\r\n\f\x00", c) >= 0:
			i++
		default:
			start := i
			for i++; i < len(data) && strings.IndexByte(delimiters, data[i]) < 0; i++ {
			}
			tokens = append(tokens, pdfCmapToken{value: string(data[start:i])})
		}
	}
	return tokens
}

type pdfCodeRange struct {
	lo string
	hi string
}

type pdfCmap struct {
	ranges  []pdfCodeRange
	lengths []int
	chars   map[string]string
}

func readPdfCmap(toUnicode pdf.Value) (m *pdfCmap) {
	defer func() {
		if recover() != nil {
			m = nil
		}
	}()

	data, err := io.ReadAll(toUnicode.Reader())
	if err != nil && len(data) == 0 {
		return nil
	}

	tokens := tokenizePdfCmap(data)
	m = &pdfCmap{chars: map[string]string{}}
	for i := 0; i < len(tokens); i++ {
		switch tokens[i].value {
		case "begincodespacerange":
			for i++; i+1 < len(tokens) && tokens[i].hex && tokens[i+1].hex; i += 2 {
				m.ranges = append(m.ranges, pdfCodeRange{tokens[i].value, tokens[i+1].value})
			}
		case "beginbfchar":
			for i++; i+1 < len(tokens) && tokens[i].hex && tokens[i+1].hex; i += 2 {
				m.chars[tokens[i].value] = decodePdfUtf16(tokens[i+1].value)
			}
		case "beginbfrange":
			for i++; i+2 < len(tokens) && tokens[i].hex && tokens[i+1].hex; {
				lo, hi := tokens[i].value, tokens[i+1].value
				i += 2
				if tokens[i].hex {
					m.addRange(lo, hi, []string{tokens[i].value}, true)
					i++
				} else if tokens[i].value == "[" {
					var dsts []string
					for i++; i < len(tokens) && tokens[i].hex; i++ {
						dsts = append(dsts, tokens[i].value)
					}
					m.addRange(lo, hi, dsts, false)
					i++
				} else {
					break
				}
			}
		}
	}

	if len(m.chars) == 0 {
		return nil
	}

	seen := map[int]bool{}
	for code := range m.chars {
		if !seen[len(code)] {
			seen[len(code)] = true
			m.lengths = append(m.lengths, len(code))
		}
	}
	sort.Ints(m.lengths)
	return m
}

func (m *pdfCmap) addRange(lo string, hi string, dsts []string, incremental bool) {
	if len(lo) == 0 || len(lo) != len(hi) || len(lo) > 4 || len(dsts) == 0 {
		return
	}

	start, end := 0, 0
	for i := 0; i < len(lo); i++ {
		start = start<<8 | int(lo[i])
		end = end<<8 | int(hi[i])
	}
	if end < start || end-start > 0xffff {
		return
	}

	for c := start; c <= end; c++ {
		code := make([]byte, len(lo))
		for i, x := len(lo)-1, c; i >= 0; i, x = i-1, x>>8 {
			code[i] = byte(x)
		}

		offset := c - start
		if incremental {
			u := utf16.Encode([]rune(decodePdfUtf16(dsts[0])))
			if len(u) == 0 {
				continue
			}
			u[len(u)-1] += uint16(offset)
			m.chars[string(code)] = string(utf16.Decode(u))
		} else if offset < len(dsts) {
			m.chars[string(code)] = decodePdfUtf16(dsts[offset])
		}
	}
}

func (m *pdfCmap) codeLength(raw string) int {
	for _, r := range m.ranges {
		n := len(r.lo)
		if n == 0 || n > len(raw) || len(r.hi) != n {
			continue
		}
		inRange := true
		for i := 0; i < n; i++ {
			if raw[i] < r.lo[i] || raw[i] > r.hi[i] {
				inRange = false
				break
			}
		}
		if inRange {
			return n
		}
	}

	for _, n := range m.lengths {
		if n <= len(raw) {
			if _, ok := m.chars[raw[:n]]; ok {
				return n
			}
		}
	}
	return min(m.lengths[0], len(raw))
}

func (m *pdfCmap) decode(raw string) string {
	var sb strings.Builder
	for len(raw) > 0 {
		n := m.codeLength(raw)
		sb.WriteString(m.chars[raw[:n]])
		raw = raw[n:]
	}
	return sb.String()
}

func groupPdfGlyphs(glyphs []pdfGlyph) []string {
	var sizes []float64
	for _, g := range glyphs {
		if g.size > 0 {
			sizes = append(sizes, g.size)
		}
	}
	threshold := 1.0
	if len(sizes) > 0 {
		sort.Float64s(sizes)
		threshold = sizes[len(sizes)/2] * 0.8
	}

	var lines []string
	var line strings.Builder
	flush := func() {
		if strings.TrimSpace(line.String()) != "" {
			lines = append(lines, line.String())
		}
		line.Reset()
	}

	for i, g := range glyphs {
		if i > 0 && math.Abs(g.y-glyphs[i-1].y) > threshold {
			flush()
		}
		line.WriteString(g.text)
	}
	flush()
	return lines
}

func getPdfPageLines(r *pdf.Reader, pageIndex int) (lines []string, err error) {
	defer func() {
		if x := recover(); x != nil {
			err = getPdfPanicError(x)
		}
	}()

	p := r.Page(pageIndex)
	if p.V.IsNull() || p.V.Key("Contents").Kind() == pdf.Null {
		return nil, nil
	}

	e := &pdfTextExtractor{}
	e.run(p.V.Key("Contents"), p.Resources(), pdfIdentity, 0)
	return groupPdfGlyphs(e.glyphs), e.err
}

func trimPdfTrailer(path string) (string, func(), error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", nil, err
	}

	eof := []byte("%%EOF")
	index := bytes.LastIndex(data, eof)
	if index < 0 || bytes.HasSuffix(bytes.TrimRight(data, "\r\n\t \x00"), eof) {
		return path, func() {}, nil
	}

	f, err := os.CreateTemp("", "*.pdf")
	if err != nil {
		return "", nil, err
	}
	_, err = f.Write(data[:index+len(eof)])
	closeErr := f.Close()
	if err == nil {
		err = closeErr
	}
	if err != nil {
		os.Remove(f.Name())
		return "", nil, err
	}

	return f.Name(), func() { os.Remove(f.Name()) }, nil
}

func optimizePdf(path string) (string, func(), error) {
	f, err := os.CreateTemp("", "*.pdf")
	if err != nil {
		return "", nil, err
	}
	f.Close()

	err = api.OptimizeFile(path, f.Name(), nil)
	if err != nil {
		os.Remove(f.Name())
		return "", nil, err
	}

	return f.Name(), func() { os.Remove(f.Name()) }, nil
}

func getTextFromPdf(path string) (string, error) {
	path, cleanup, err := trimPdfTrailer(path)
	if err != nil {
		return "", err
	}
	defer cleanup()

	if api.ValidateFile(path, nil) != nil {
		optimizedPath, optimizeCleanup, err := optimizePdf(path)
		if err == nil {
			defer optimizeCleanup()
			path = optimizedPath
		}
	}

	f, r, err := pdf.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	var mergedTexts []string
	var pageErr error
	for pageIndex := 1; pageIndex <= r.NumPage(); pageIndex++ {
		lines, err := getPdfPageLines(r, pageIndex)
		if err != nil && pageErr == nil {
			pageErr = fmt.Errorf("page %d: %w", pageIndex, err)
		}
		mergedTexts = append(mergedTexts, lines...)
	}

	if len(mergedTexts) == 0 && pageErr != nil {
		return "", pageErr
	}
	return strings.Join(mergedTexts, "\n"), nil
}
