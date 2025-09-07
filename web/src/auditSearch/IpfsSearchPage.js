import React, { Component } from 'react';
import { Input, Button, Layout, Typography, Space, message } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { SearchOutlined } from '@ant-design/icons';
import { withRouter } from 'react-router-dom';
import './IpfsSearchPage.less';

// 步骤条数据
const steps = [
  { title: "输入患者身份证号" },
  { title: "获取归档数据信息" },
  { title: "选择归档记录查询详细信息" },
];

export class IPFSSearchPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      correlationId: '',
      focused: false,
    };
  }

  handleInputChange = (e) => {
    this.setState({
      correlationId: e.target.value,
    });
  };

  handleSearch = () => {
    const { correlationId } = this.state;
    if (correlationId.trim()) {
      // 跳转到结果页面
      this.props.history.push(`/ipfs-search/result/${correlationId}`);
    } else {
      // 提示用户输入
      message.error('请输入有效的索引(correlationId)');
    }
  };

  handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.handleSearch();
    }
  };

  handleFocus = () => {
    this.setState({ focused: true });
  };

  handleBlur = () => {
    this.setState({ focused: false });
  };

  render() {
    const { correlationId, focused } = this.state;
    const { Title } = Typography;
    const { Content } = Layout;


    return (
      <div className="ipfs-search-layout">
        <Content className="ipfs-search-content">
          <div className="ipfs-search-header">
            <Title level={2} className="ipfs-search-title">患者上链数据信息查询</Title>
          </div>
          <div className="ipfs-search-body">
            <Space direction="vertical" size="large" className="ipfs-search-space">
              <div className={`ipfs-search-input-wrapper ${focused ? 'focused' : ''}`}>
                <div className="ipfs-search-input-container">
                  <SearchOutlined className="ipfs-search-icon" />
                  <Input
                    placeholder="请输入索引(correlationId)"
                    value={correlationId}
                    variant="borderless"
                    onChange={this.handleInputChange}
                    onKeyPress={this.handleKeyPress}
                    size="large"
                    className="ipfs-search-input"
                    onFocus={this.handleFocus}
                    onBlur={this.handleBlur}
                    autoFocus
                  />
                  <Button
                    type="primary"
                    onClick={this.handleSearch}
                    disabled={!correlationId.trim()}
                    className="ipfs-search-button"
                  >
                    搜索
                  </Button>
                </div>
              </div>
            </Space>
          </div>


        </Content>
        {/* 横向步骤条（底部，细线灰色，非粗体） */}
        <div style={{
          width: '100%',

          margin: '80px auto 0 auto',
          paddingBottom: 32,
          display: 'flex',
          justifyContent: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {steps.map((step, idx) => (
              <React.Fragment key={step.title}>
                <div style={{
                  background: '#fafbfc',
                  borderRadius: 10,
                  boxShadow: '0 1px 4px 0 rgba(45,90,241,0.03)',
                  padding: '7px 20px',
                  minWidth: 100,
                  fontWeight: 400,
                  fontSize: 15,
                  color: '#888',
                  border: '1px solid #e3e7f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 1,
                }}>
                  {step.title}
                </div>
                {idx < steps.length - 1 && (
                  <RightOutlined style={{ fontSize: 18, color: '#d1d5db', margin: '0 8px' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        {/* 查询操作提示 */}
        <div style={{
          margin: '0px auto 0 auto',
          width: '100%',
          maxWidth: 900,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#3460d3',
          fontSize: 15,
          fontWeight: 500,
          gap: 8,
        }}>
          <FontAwesomeIcon icon={faExclamationCircle} style={{ color: '#3460d3', fontSize: 18 }} />
          所有查询操作均会被记录
        </div>

      </div>
    );
  }
}

export default withRouter(IPFSSearchPage);