import React, { useEffect, useState } from 'react';
import { createStyles } from 'antd-style';
import { EditorCore } from '@/editor-core';
import { useEditorCoreSetter, useEditorFontsReady } from '../context';
import ActionPopover from './ActionPopover';

const useStyles = createStyles(({ css }) => ({
  // ActionPopover 用 absolute 定位，需要一个 relative 锚点
  wrapper: css`
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  `,
  stage: css`
    width: 100%;
    height: 100%;
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
                 "font":"AvenirNext-Bold",
                //  "font":"ComicSansMS",
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

const EditorCanvas: React.FC = () => {
  const { styles } = useStyles();
  const setCore = useEditorCoreSetter();
  const fontsReady = useEditorFontsReady();
  useEffect(() => {
    if (!fontsReady) return;
    // useEffect 在 DOM commit 之后才跑，#editor-container 必然存在
    const core = new EditorCore('editor-container');
    setCore(core);
    return () => {
      core.destroy();
      setCore(null);
    };
  }, [fontsReady, setCore]);
  return (
    <div className={styles.wrapper}>
      <div id='editor-container' className={styles.stage}></div>
      <ActionPopover />
    </div>
  );
};

export default EditorCanvas;
