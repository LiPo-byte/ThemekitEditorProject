import { createStyles } from 'antd-style';
import { Button } from 'antd';
import React from 'react';
import { useEditorCore } from '../context';
const useStyles = createStyles(({ token, css }) => ({
  wrap: css`
    padding: 12px 16px;
  `,
  title: css`
    font-size: 12px;
    font-weight: 600;
    color: ${token.colorTextTertiary};
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 8px;
  `,
  placeholder: css`
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${token.colorTextQuaternary};
    font-size: 12px;
    border: 1px dashed ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
  `,
}));

const mockdata = {
  "version":0,
  "isLockScreen":false,
  "type":1,
  "textAlignment":1,
  "sizes":[
         {
            "size":1,
         "name":"Pink_Love_Heart_Small",
            "padding":16,
            "time":{
                 "font":"HFBestWishes",
                 "textSize":28,
                 "textHeight":24,
                 "textColor":"#FBA3C9",
                 "alpha":1.0
            },
            "day" :{
                 "font":"AvenirNext-Bold",
                 "textSize":20,
                 "textHeight":18,
                 "textColor":"#FBA3C9",
                 "alpha":1.0,
                  "topSpacing":10,
                 "bottomSpacing":10
            },
            "date":{
                 "font":"AvenirNext-Bold",
                 "textSize":16,
                 "textHeight":15,
                 "textColor":"#FBA3C9",
                 "alpha":1.0
            }
         },
         {
            "size":2,
         "name":"Pink_Love_Heart_Medium",
            "padding":16,
            "time":{
                 "font":"AvenirNext-Bold",
                 "textSize":32,
                 "textHeight":29,
                 "textColor":"#FBA3C9",
                 "alpha":1.0
            },
            "day" :{
                 "font":"AvenirNext-Bold",
                 "textSize":28,
                 "textHeight":25,
                 "textColor":"#FBA3C9",
                 "alpha":1.0,
                  "topSpacing":14,
                 "bottomSpacing":10
            },
            "date":{
                 "font":"AvenirNext-Bold",
                 "textSize":18,
                 "textHeight":16,
                 "textColor":"#FBA3C9",
                 "alpha":1.0
            }
         },
         {
            "size":3,
         "name":"Pink_Love_Heart_Large",
            "padding":16,
            "time":{
                 "font":"AvenirNext-Bold",
                 "textSize":54,
                 "textHeight":47,
                 "textColor":"#FBA3C9",
                 "alpha":1.0
            },
            "day" :{
                 "font":"AvenirNext-Bold",
                 "textSize":38,
                 "textHeight":33,
                 "textColor":"#FBA3C9",
                 "alpha":1.0,
                  "topSpacing":20,
                 "bottomSpacing":20
            },
            "date":{
                 "font":"AvenirNext-Bold",
                 "textSize":30,
                 "textHeight":26,
                 "textColor":"#FBA3C9",
                 "alpha":1.0
            }
         }
  ]
}
const LeftPanel: React.FC = () => {
  const { styles } = useStyles();
  const core = useEditorCore();
  const handleAddWidget = () => {
    if (!core) {
      console.warn('[LeftPanel] EditorCore 尚未初始化');
      return;
    }
    core.addWidget(mockdata);
  };
  return (
    <div className={styles.wrap}>
      <div className={styles.title}>组件树</div>
      <div className={styles.placeholder}>预留区域</div>
      
      <Button type="primary" onClick={handleAddWidget}>添加组件</Button>
    </div>
  );
};

export default LeftPanel;
