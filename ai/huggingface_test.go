package ai_test

import (
	"testing"

	"github.com/casbin/casibase/ai"
	"github.com/casbin/casibase/proxy"
)

func TestGetHuggingFaceResp(t *testing.T) {
	proxy.InitHttpClient()

	prompt := "Hello AI. Who are you?"
	secretKey := "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"

	resp, err := ai.GetHuggingFaceResp(prompt, secretKey)
	if err != nil {
		t.Errorf("GetHuggingFaceResp err: %v", err)
		return
	}

	if resp == "" {
		t.Error("GetHuggingFaceResp err: resp is nil")
		return
	}

	t.Logf("resp: %v", resp)
}

func TestHuggingFaceModelProvider_QueryText(t *testing.T) {
	proxy.InitHttpClient()

	prompt := "Hello AI. Who are you?"
	secretKey := "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"

	p, err := ai.NewHuggingFaceModelProvider(secretKey)
	if err != nil {
		t.Errorf("NewHuggingFaceModelProvider err: %v", err)
		return
	}

	err = p.QueryText(prompt, nil, nil)
	if err != nil {
		t.Errorf("QueryText err: %v", err)
		return
	}

	t.Logf("QueryText success")
}
