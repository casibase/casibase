# Forbidden Words Feature

## Overview

The Forbidden Words feature allows administrators to configure a list of words or phrases that are not allowed in user messages within the AI chat interface. When a user attempts to send a message containing any of the forbidden words, the message will be rejected with an error message.

## Purpose

This feature provides basic content filtering and security for chat inputs, allowing organizations to:
- Prevent users from submitting messages with inappropriate or offensive language
- Block specific keywords that may be sensitive or restricted in their context
- Implement basic input validation for compliance requirements

## Configuration

### Backend Configuration

The forbidden words are stored in the `Store` object as a string array field called `ForbiddenWords`. Each store can have its own independent list of forbidden words.

#### Database Schema

```go
type Store struct {
    // ... other fields
    ForbiddenWords []string `xorm:"text" json:"forbiddenWords"`
    // ... other fields
}
```

### Frontend Configuration

1. Navigate to the Store edit page in the admin interface
2. Locate the "Forbidden words" field
3. Add words or phrases by typing them and pressing Enter
4. Each entry will be added as a separate tag
5. Click "Save" to persist the changes

**Note**: The forbidden words field uses a tags-based input, allowing multiple words to be added easily.

## How It Works

### Validation Logic

1. When a user submits a message through the chat interface, the backend receives the message text
2. The system retrieves the Store configuration for the current chat
3. The message text is checked against all forbidden words in the store's `ForbiddenWords` list
4. The check is **case-insensitive** - for example, if "badword" is forbidden, "BadWord" and "BADWORD" will also be blocked
5. The check uses **substring matching** - if "test" is forbidden, it will also block messages containing "testing" or "attest"
6. If any forbidden word is found:
   - The message is rejected
   - An error message is returned: `"Your message contains a forbidden word: \"<word>\""`
   - The message is not saved to the database
   - The AI does not process the message
7. If no forbidden words are found, the message is processed normally

### Code Implementation

The validation is performed in two places:

1. **Store Model** (`object/store.go`):
```go
func (store *Store) ContainsForbiddenWords(text string) (bool, string) {
    if store.ForbiddenWords == nil || len(store.ForbiddenWords) == 0 {
        return false, ""
    }

    lowerText := strings.ToLower(text)
    for _, forbiddenWord := range store.ForbiddenWords {
        if forbiddenWord == "" {
            continue
        }
        lowerForbiddenWord := strings.ToLower(forbiddenWord)
        if strings.Contains(lowerText, lowerForbiddenWord) {
            return true, forbiddenWord
        }
    }
    return false, ""
}
```

2. **Message Controller** (`controllers/message.go`):
The validation is performed in the `AddMessage` function before the message is saved:
```go
// Check for forbidden words
storeId := util.GetId(message.Owner, message.Store)
store, err := object.GetStore(storeId)
if err != nil {
    c.ResponseError(err.Error())
    return
}
if store != nil {
    contains, forbiddenWord := store.ContainsForbiddenWords(message.Text)
    if contains {
        c.ResponseError(fmt.Sprintf("Your message contains a forbidden word: \"%s\"", forbiddenWord))
        return
    }
}
```

## User Experience

When a user submits a message containing a forbidden word:

1. The message input is not cleared
2. An error notification appears at the top of the chat interface
3. The error message clearly indicates which forbidden word was detected
4. The user can edit their message to remove the forbidden word and resubmit

## Examples

### Example 1: Basic Word Blocking

**Configuration:**
- Forbidden words: `["spam", "badword", "offensive"]`

**User message:** "This is spam content"

**Result:** Message is rejected with error: `"Your message contains a forbidden word: "spam""`

### Example 2: Case-Insensitive Matching

**Configuration:**
- Forbidden words: `["test"]`

**User message:** "This is a TEST message"

**Result:** Message is rejected with error: `"Your message contains a forbidden word: "test""`

### Example 3: Substring Matching

**Configuration:**
- Forbidden words: `["bad"]`

**User message:** "This is a badword in the message"

**Result:** Message is rejected with error: `"Your message contains a forbidden word: "bad""`

## Limitations

1. **Substring Matching**: The current implementation uses substring matching, which may result in false positives. For example, if "test" is forbidden, legitimate words like "attest" or "testing" will also be blocked.

2. **No Word Boundary Detection**: The system doesn't distinguish between whole words and parts of words.

3. **First Match Only**: When multiple forbidden words are present in a message, only the first one found is reported in the error message.

4. **No Regex Support**: The current implementation doesn't support regular expressions or pattern matching.

## Best Practices

1. **Be Specific**: Use specific phrases rather than common substrings to avoid false positives
2. **Test Thoroughly**: Test your forbidden words list with common message patterns to ensure it doesn't block legitimate content
3. **Use Phrases**: Instead of blocking single letters or very short words, use complete phrases or specific terms
4. **Document Your List**: Keep a documented list of forbidden words and their reasons for easy maintenance
5. **Review Regularly**: Periodically review and update your forbidden words list based on usage patterns

## Future Enhancements

Potential improvements for this feature could include:

1. **Word Boundary Detection**: Match only whole words, not substrings
2. **Regular Expression Support**: Allow pattern-based matching for more sophisticated filtering
3. **Whitelist Support**: Allow certain contexts or phrases that contain forbidden words
4. **Severity Levels**: Different actions based on severity (warning vs. blocking)
5. **Logging and Analytics**: Track blocked messages for compliance and monitoring
6. **Custom Error Messages**: Allow administrators to customize the error message shown to users
7. **Language-Specific Rules**: Different forbidden word lists for different languages
8. **Integration with External Services**: Integration with services like llm-guard, vigil-llm, or pytector for advanced content filtering

## Testing

Unit tests for the forbidden words functionality can be found in `object/store_forbidden_words_test.go`. The tests cover:

- Empty forbidden words list
- Nil forbidden words list
- Contains forbidden word (exact match)
- Case-insensitive checking
- No forbidden words (clean message)
- Empty strings in forbidden words list
- Forbidden word as substring
- Multiple forbidden words with first match priority

Run the tests with:
```bash
go test -v ./object -run TestContainsForbiddenWords
```

## Related Projects

This feature provides basic text filtering. For more advanced content security, consider:

- [llm-guard](https://github.com/protectai/llm-guard) - Comprehensive security toolkit for LLM applications
- [vigil-llm](https://github.com/deadbits/vigil-llm) - Security scanner for LLM prompts
- [pytector](https://github.com/MaxMLang/pytector) - Python-based content moderation toolkit
