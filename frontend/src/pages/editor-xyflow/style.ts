import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ token, css }) => ({
  root: css`
    display: flex;
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    background: ${token.colorBgLayout};
    color: ${token.colorText};
    overflow: hidden;
  `,
  body: css`
    flex: 1;
    display: flex;
    min-height: 0;
    position: relative;
    overflow: hidden;
  `,
  leftPanelToggle: css`
    position: absolute;
    top: 80px;
    left: 12px;
    z-index: 30;
  `,
}));
