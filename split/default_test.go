// Copyright 2023 The casbin Authors. All Rights Reserved.
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

package split

import (
	"testing"
)

func TestDefaultSplitProvider_SplitText(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected []string
	}{
		{
			name:  "Test Case 1",
			input: "This is a long text with\nmultiple lines and padding.",
			expected: []string{
				"This is a long text with\nmultiple lines and padding.",
			},
		},
		{
			name:  "Test Case 2",
			input: "Short text (with line breaks).",
			expected: []string{
				"Short text (with line breaks).",
			},
		},
		{
			name: "Test Case 3",
			input: `This is line 1.
This is line 2.
This is line 3.`,
			expected: []string{
				"This is line 1.\nThis is line 2.\nThis is line 3.",
			},
		},
		{
			name: "Test Case 4",
			input: `---
title: Application Config
description: Configure your application's authentication
keywords: [config, application]
authors: [ErikQQY]
---

` + "```mdx-code-block" + `
		import styles from '../styles.module.css';
		import CasdoorCard from "@site/src/components/CasdoorCard"
		` + "```" + `

After you deploy Casdoor on your server and set up your organization, you can now deploy your applications!

Let's see how to configure your application's authentication using Casdoor!

:::note

For example, I want to set up my Forum using [Casnode](https://casnode.org).

:::

I create my application and fill in some necessary configurations.

Select the organization I created so that users in this organization can use this application.

![Organization](/img/application/config/organization.png)

Since this organization is named ` + "`my_organization`" + `, I choose it from the drop-down menu.

![Select Organization](/img/application/config/selectorganization.png)

Next, I want my users to be able to use Casdoor for authentication when they sign up. So, I fill in the redirect URL here as **<https://your-site-url.com/callback>**.

:::caution

Please note that the ` + "`callback URL`" + ` in the provider application should be Casdoor's callback URL, and the ` + "`Redirect URL`" + ` in Casdoor should be your website's callback URL.

#### Further Understanding

To make the authentication process work, the detailed steps are as follows:

1. Users send a request to Casdoor.
2. Casdoor uses the ` + "`Client ID`" + ` and ` + "`Client Secret`" + ` to authenticate with GitHub, Google, or other providers.
3. If the authentication is successful, GitHub calls back to Casdoor to notify Casdoor about the successful authentication. Therefore, the GitHub authorization callback URL should be your Casdoor's callback URL, which is **<http://your-casdoor-url.com/callback>**.
4. Casdoor then informs the application about the authentication success. This means that the Casdoor callback URL should be your application's callback URL, which is **<http://your-site-url.com/callback>**.

:::

You can also add third-party apps for sign up by adding providers and setting their properties.

![Select providers](/img/application/config/selectproviders.png)

` + "```mdx-code-block" + `
		<div className={styles.signingradientborder}>
		<CasdoorCard src="https://door.casdoor.com/login/oauth/authorize?client_id=014ae4bd048734ca2dea&response_type=code&redirect_uri=https://forum.casbin.com/callback&scope=read&state=app-casbin-forum" height= "680" />
		</div>
		` + "```" + `

:::tip

Note that if you don't want users to access your app using a **username/password**, you can switch off the ` + "`Password On`" + ` button. This way, users can only access the app using third-party services.

![Password On](/img/application/config/PasswordOn.png)

:::`,
			expected: []string{
				"---\ntitle: Application Config\ndescription: Configure your application's authentication\nkeywords: [config, application]\nauthors: [ErikQQY]\n---\n\n```mdx-code-block\n\t\timport styles from '../styles.module.css';\n\t\timport CasdoorCard from \"@site/src/components/CasdoorCard\"\n\t\t```\n\nAfter you deploy Casdoor on your server and set up your organization, you can now deploy your applications!\n\nLet's see how to configure your application's authentication using Casdoor!\n\n:::note\n\nFor example, I want to set up my Forum using [Casnode](https://casnode.org).\n\n:::\n\nI create my application and fill in some necessary configurations.\n",
				"Select the organization I created so that users in this organization can use this application.\n\n![Organization](/img/application/config/organization.png)\n\nSince this organization is named `my_organization`, I choose it from the drop-down menu.\n\n![Select Organization](/img/application/config/selectorganization.png)\n\nNext, I want my users to be able to use Casdoor for authentication when they sign up. So, I fill in the redirect URL here as **<https://your-site-url.com/callback>**.\n\n:::caution\n",
				"Please note that the `callback URL` in the provider application should be Casdoor's callback URL, and the `Redirect URL` in Casdoor should be your website's callback URL.\n\n#### Further Understanding\n\nTo make the authentication process work, the detailed steps are as follows:\n\n1. Users send a request to Casdoor.\n2. Casdoor uses the `Client ID` and `Client Secret` to authenticate with GitHub, Google, or other providers.",
				"3. If the authentication is successful, GitHub calls back to Casdoor to notify Casdoor about the successful authentication. Therefore, the GitHub authorization callback URL should be your Casdoor's callback URL, which is **<http://your-casdoor-url.com/callback>**.\n4. Casdoor then informs the application about the authentication success. This means that the Casdoor callback URL should be your application's callback URL, which is **<http://your-site-url.com/callback>**.\n\n:::\n\nYou can also add third-party apps for sign up by adding providers and setting their properties.\n",
				"![Select providers](/img/application/config/selectproviders.png)\n\n```mdx-code-block\n\t\t<div className={styles.signingradientborder}>\n\t\t<CasdoorCard src=\"https://door.casdoor.com/login/oauth/authorize?client_id=014ae4bd048734ca2dea&response_type=code&redirect_uri=https://forum.casbin.com/callback&scope=read&state=app-casbin-forum\" height= \"680\" />\n\t\t</div>\n\t\t```\n\n:::tip\n\nNote that if you don't want users to access your app using a **username/password**, you can switch off the `Password On` button. This way, users can only access the app using third-party services.\n\n![Password On](/img/application/config/PasswordOn.png)\n\n:::",
			},
		},
	}

	for _, test := range tests {
		t.Run(test.input, func(t *testing.T) {
			provider, err := NewDefaultSplitProvider()
			if err != nil {
				t.Fatalf("Error occurred: %v", err)
			}

			result, err := provider.SplitText(test.input)
			if err != nil {
				t.Fatalf("Error occurred: %v", err)
			}

			if len(result) != len(test.expected) {
				t.Fatalf("Expected %d results, got %d", len(test.expected), len(result))
			}

			for i, r := range result {
				if r != test.expected[i] {
					t.Errorf("Missmatch at index %d:\n expected %q\n got %q", i, test.expected[i], r)
				}
			}
		})
	}
}
