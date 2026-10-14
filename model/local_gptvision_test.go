package model

import (
	"encoding/base64"
	"testing"

	"github.com/sashabaranov/go-openai"
)

func TestVisionHistoryImageLinksStayText(t *testing.T) {
	const text = "See ![diagram](https://example.invalid/diagram.png)"
	for _, author := range []string{"System", "AI", "Tool"} {
		t.Run(author, func(t *testing.T) {
			messages, err := OpenaiRawMessagesToGptVisionMessages([]*RawMessage{{
				Author: author, Text: text, ReasoningContent: "reasoning",
				ToolCall: openai.ToolCall{ID: "call_1"}, ToolCallID: "call_1",
				Images: []ImageAttachment{{Data: []byte("image"), MimeType: "image/png"}},
			}})
			if err != nil || len(messages) != 1 {
				t.Fatalf("conversion failed: %v, messages: %v", err, messages)
			}
			got := messages[0]
			if got.Content != text || len(got.MultiContent) != 0 {
				t.Fatalf("non-user image reference must remain text: %+v", got)
			}
			if got.ReasoningContent != "reasoning" {
				t.Fatal("reasoning content was lost")
			}
			if author == "AI" && (len(got.ToolCalls) != 1 || got.ToolCalls[0].ID != "call_1") {
				t.Fatal("assistant tool call was lost")
			}
			if author == "Tool" && got.ToolCallID != "call_1" {
				t.Fatal("tool result association was lost")
			}
		})
	}
}

func TestVisionUserImageAttachment(t *testing.T) {
	data := []byte("image")
	messages, err := OpenaiRawMessagesToGptVisionMessages([]*RawMessage{{
		Author: "user", Text: "Explain this diagram",
		Images: []ImageAttachment{{Data: data, MimeType: "image/png"}},
	}})
	if err != nil || len(messages) != 1 {
		t.Fatalf("conversion failed: %v", err)
	}
	got := messages[0]
	if got.Role != openai.ChatMessageRoleUser || len(got.MultiContent) != 2 {
		t.Fatalf("user image input was lost: %+v", got)
	}
	if got.MultiContent[0].Text != "Explain this diagram" ||
		got.MultiContent[1].ImageURL.URL != "data:image/png;base64,"+base64.StdEncoding.EncodeToString(data) {
		t.Fatalf("unexpected image content: %+v", got.MultiContent)
	}
}
