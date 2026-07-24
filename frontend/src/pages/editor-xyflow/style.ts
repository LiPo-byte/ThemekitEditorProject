import { createStyles, keyframes } from 'antd-style';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

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
  loadingMask: css`
    position: absolute;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: all;
    background: ${token.colorBgMask};
    backdrop-filter: blur(2px);
  `,
  loadingCard: css`
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 12px 18px;
    border-radius: 12px;
    background: ${token.colorBgElevated}f2;
    backdrop-filter: blur(14px);
    box-shadow: ${token.boxShadowSecondary};
    color: ${token.colorText};
    font-size: 13px;
    line-height: 1;
    user-select: none;
  `,
  loadingDot: css`
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid ${token.colorBorderSecondary};
    border-top-color: ${token.colorPrimary};
    animation: ${spin} 0.7s linear infinite;
  `,
}));
