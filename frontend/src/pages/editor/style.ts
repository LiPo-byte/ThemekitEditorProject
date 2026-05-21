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
  leftPanel: css`
    width: 280px;
    position: relative;
    z-index: 2;
    background: ${token.colorBgElevated}99;
    border-right: 1px solid ${token.colorBorderSecondary};
    overflow: auto;
    backdrop-filter: blur(14px);
  `,
  rightPanel: css`
    width: 320px;
    position: relative;
    margin-left: auto;
    z-index: 2;
    background: ${token.colorBgElevated}99;
    border-left: 1px solid ${token.colorBorderSecondary};
    overflow: auto;
    backdrop-filter: blur(14px);
  `,
  canvas: css`
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: ${token.colorBgLayout};
    overflow: auto;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
}));
