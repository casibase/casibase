import React, {useEffect, useState} from "react";
import {Button} from "antd";
import {Sender} from "@ant-design/x";
import {LinkOutlined} from "@ant-design/icons";
import i18next from "i18next";

const ChatInput = ({
  value,
  store,
  onChange,
  onSend,
  onFileUpload,
  loading,
  disableInput,
  messageError,
  onCancelMessage,
  onVoiceInputStart,
  onVoiceInputEnd,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const sendButtonDisabled = messageError || value === "" || disableInput;

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768); // Common breakpoint for mobile devices
    };

    // Initial check
    checkIsMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIsMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return (
    <div style={{
      position: "absolute",
      bottom: isMobile ? "-10px" : 0, // Move chat input lower on mobile
      left: 0,
      right: 0,
      padding: isMobile ? "8px 12px" : "16px 24px", // Reduced padding on mobile
      zIndex: 1,
    }}>
      <div style={{
        maxWidth: isMobile ? "100%" : "700px", // Full width on mobile
        margin: "0 auto",
      }}>
        <Sender
          prefix={
            <Button
              type="text"
              icon={<LinkOutlined />}
              onClick={onFileUpload}
              disabled={disableInput || messageError || store?.disableFileUpload}
              style={{
                color: (disableInput || messageError) ? "#d9d9d9" : undefined,
                padding: isMobile ? "0 3px" : undefined, // Reduce button padding on mobile
                fontSize: isMobile ? "10px" : undefined, // Smaller icon size on mobile
              }}
              size={isMobile ? "small" : "middle"} // Use smaller button on mobile
            />
          }
          loading={loading}
          disabled={disableInput}
          style={{
            flex: 1,
            borderRadius: "8px",
            background: "#f5f5f5",
            fontSize: isMobile ? "14px" : undefined, // Smaller font size on mobile
            height: isMobile ? "45px" : undefined, // Custom height on mobile
          }}
          buttonProps={{
            // Customize send and voice button styles
            size: isMobile ? "small" : "middle", // Make buttons smaller on mobile
            style: isMobile ? {
              fontSize: "14px",
              padding: "0 6px",
              height: "24px",
              minWidth: "24px",
            } : undefined,
          }}
          placeholder={messageError ? "" : i18next.t("chat:Type message here")}
          value={value}
          onChange={onChange}
          onSubmit={() => {
            if (!sendButtonDisabled) {
              onSend(value);
              onChange("");
            }
          }}
          onCancel={() => {
            onCancelMessage && onCancelMessage();
          }}
          allowSpeech
          onSpeechStart={onVoiceInputStart}
          onSpeechEnd={onVoiceInputEnd}
        />
      </div>
    </div>
  );
};

export default ChatInput;
