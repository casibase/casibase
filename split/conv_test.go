package split

import (
	"testing"
)

func TestConvolutionalSplitProvider_SplitText(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		window   int
		stride   int
		padding  int
		expected []string
	}{
		{
			name:     "Test Case 1",
			input:    "Hello, world! This is a test.",
			window:   5,
			stride:   2,
			padding:  0,
			expected: []string{"Hello", "llo, ", "o, wo", " worl", "orld!", "ld! T", "! Thi", "This ", "is is", " is a", "s a t", "a tes", "test."},
		},
		{
			name:     "Test Case 2",
			input:    "ABCDEF",
			window:   3,
			stride:   3,
			padding:  0,
			expected: []string{"ABC", "DEF"},
		},
		{
			name:     "Test Case 3",
			input:    "This is a long text with\nmultiple lines and padding.",
			window:   10,
			stride:   5,
			padding:  3,
			expected: []string{"This is", "is is a lo", " a long te", "ng text wi", "xt with\nmu", "th\nmultipl", "ltiple lin", "e lines an", "es and pad", "d padding."},
		},
		{
			name:     "Test Case 4",
			input:    "Short\nText\nWith\nNewlines",
			window:   7,
			stride:   7,
			padding:  0,
			expected: []string{"Short\nT", "ext\nWit", "h\nNewli"},
		},
		{
			name: "Test Case 5",
			input: `This is line 1.
This is line 2.
This is line 3.`,
			window:   10,
			stride:   10,
			padding:  0,
			expected: []string{"This is li", "ne 1.\nThis", " is line 2", ".\nThis is "},
		},
		{
			name: "Test Case 6",
			input: `This is line 1.
This is line 2.
This is line 3.`,
			window:   5,
			stride:   5,
			padding:  3,
			expected: []string{"Th", "is is", " line", " 1.\nT", "his i", "s lin", "e 2.\n", "This ", "is li", "ne 3."},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			provider, err := NewConvolutionalSplitProvider(test.window, test.stride, test.padding)
			if err != nil {
				t.Errorf("Error creating ConvolutionalSplitProvider: %v", err)
			}

			result, err := provider.SplitText(test.input)
			if err != nil {
				t.Errorf("Error splitting text: %v", err)
			}

			if len(result) != len(test.expected) {
				t.Errorf("Expected %d splits, but got %d", len(test.expected), len(result))
			}

			for i, substring := range result {
				if substring != test.expected[i] {
					t.Errorf("Mismatch at index %d. Expected '%s', but got '%s'", i, test.expected[i], substring)
				}
			}
		})
	}
}
