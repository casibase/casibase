package model

import (
	"fmt"
	"io"
	"strings"

	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common/errors"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common/profile"
	hunyuan "github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/hunyuan/v20230901"
)

type TencentHunyuanClient struct {
	credential *common.Credential
	endpoint   string
	modelName  string
}

func NewTencentHunyuanProvider(secretID, secretKey, endpoint, modelName string) (*TencentHunyuanClient, error) {
	if strings.TrimSpace(secretID) == "" || strings.TrimSpace(secretKey) == "" {
		return nil, fmt.Errorf("invalid credentials: secretID and secretKey cannot be empty")
	}

	if strings.TrimSpace(endpoint) == "" {
		endpoint = "hunyuan.tencentcloudapi.com"
	}
	return &TencentHunyuanClient{
		credential: common.NewCredential(secretID, secretKey),
		endpoint:   endpoint,
		modelName:  modelName,
	}, nil
}

func (c *TencentHunyuanClient) GetPricing() string {
	return `Pricing information for Tencent Hunyuan models is not yet available.`
}

func (c *TencentHunyuanClient) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {

	clientProfile := profile.NewClientProfile()
	clientProfile.HttpProfile.Endpoint = c.endpoint
	client, err := hunyuan.NewClient(c.credential, "", clientProfile)
	if err != nil {
		return nil, fmt.Errorf("failed to create Hunyuan client: %v", err)
	}

	request := hunyuan.NewChatCompletionsRequest()
	request.Model = common.StringPtr(c.modelName)

	request.Messages = []*hunyuan.Message{
		{
			Role:    common.StringPtr("user"),
			Content: common.StringPtr(question),
		},
	}

	response, err := client.ChatCompletions(request)
	if _, ok := err.(*errors.TencentCloudSDKError); ok {
		return nil, fmt.Errorf("TencentCloud SDK error: %s", err)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %v", err)
	}

	if response.Response == nil || len(response.Response.Choices) == 0 {
		return nil, fmt.Errorf("unexpected empty response")
	}
	respText := strings.TrimSpace(*response.Response.Choices[0].Message.Content)

	_, err = fmt.Fprint(writer, respText)
	if err != nil {
		return nil, fmt.Errorf("failed to write response: %v", err)
	}

	modelResult, err := getDefaultModelResult(c.modelName, question, respText)
	if err != nil {
		return nil, err
	}

	return modelResult, nil
}
