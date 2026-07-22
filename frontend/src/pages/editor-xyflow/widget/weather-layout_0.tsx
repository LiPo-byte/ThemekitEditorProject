import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
  useEditorGetParentNodeData,
} from '../context';
import CropEditableImage from '../components/CropEditableImage';
import { resolveWidgetFontFamily } from './util';
import './style.css';
const iconStyle = { marginRight: 5 };
const localicon = <svg
  data-t="1784082717549"
  className="icon"
  viewBox="0 0 1024 1024"
  xmlns="http://www.w3.org/2000/svg"
  width={10}
  height={10}
  style={iconStyle}
  >
    <path
      d="M513.023453 1023.998635H511.999454a63.556182 63.556182 0 0 1-47.103937-20.479973 2686.972417 2686.972417 0 0 1-184.797621-219.613574C162.269787 625.663166 102.4 499.233468 102.4 409.053321 102.4 183.227489 286.173622 0 511.999454 0c225.757566 0 409.599454 183.295756 409.599454 409.053321 0 54.81806-20.957839 121.855838-62.941783 199.748001-39.935947 74.7519-100.351866 161.791784-179.745894 258.047656l-0.546132 0.477866-117.691577 134.143821a61.439918 61.439918 0 0 1-47.650069 22.52797zM511.999454 600.0632a191.556011 191.556011 0 0 0 191.487745-191.487745A191.146412 191.146412 0 0 0 511.999454 217.565577 191.146412 191.146412 0 1 0 511.999454 600.0632z"
      fill="#000000"
    ></path>
  </svg>

const getTextStyle = (parentId?: string, textData?: any) => ({
  fontSize: textData?.textSize ?? 14,
  fontFamily: resolveWidgetFontFamily(parentId, textData?.font),
  opacity: textData?.alpha ?? 1,
  color: textData?.textColor ?? '#111827',
  lineHeight: 1,
  // height: textData?.textHeight ? `${textData.textHeight}px` : 'auto',
  whiteSpace: 'nowrap' as const,
});
const days = ['Tomorrow', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const hours = ['10: 00', '11: 00', '12: 00', '13: 00', '14: 00', '15: 00'];
const baseContainerStyle = {
  position: 'relative',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff',
  padding: '10px 14px',
};
const contentStyle: any = { position: 'relative', zIndex: 2 };
const headerRowStyle = { marginBottom: 26, display: 'flex', alignItems: 'center' };
const subRowStyle = { marginBottom: 8, display: 'flex', alignItems: 'center' };
const baseRowStyle = { display: 'flex', alignItems: 'center' };
const weatherIconStyle = { width: '60px', height: '60px', marginRight: 4 };
const weatherIconPlaceholderStyle = {
  width: '60px',
  height: '60px',
  marginRight: 4,
  background: '#00000008',
};
const hourlyIconStyle = { width: '15px', height: '15px' };
const hourlyIconPlaceholderStyle = { width: '15px', height: '15px', background: '#00000008' };
const daysRowStyle = {
  width: '100%',
  height: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};
const daysLabelStyle = { width: '20px' };
const daysWeatherStyle = { display: 'flex', alignItems: 'center' };
const daysIconStyle = { width: '10px', marginRight: 8 };
const daysIconPlaceholderStyle = { width: '10px', height: '10px', marginRight: 8, background: '#00000008' };
const getContainerStyle: any = (radius: number | undefined, overflow: 'visible' | 'hidden') => ({
  ...baseContainerStyle,
  overflow,
  borderRadius: `${radius ?? 0}px`,
});
const getMainRowStyle: any = (height: number | undefined, marginBottom: number) => ({
  marginBottom,
  display: 'flex',
  alignItems: 'center',
  height,
});
const getColumnStyle: any = (parentId: string | undefined, textData: any) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  ...getTextStyle(parentId, textData),
});
const getHourlyRowStyle: any = (marginBottom: number) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom,
});
const getDividerStyle:any = (color?: string, alpha?: number, marginBottom = 18) => ({
  marginBottom,
  height: 1,
  background: color || '#000000',
  opacity: alpha || 1,
});

export default function WeatherLayout0(props: any) {
  const data = props.data;
  const scale = props.scale || 1;
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const getParentNodeData = useEditorGetParentNodeData();
  const parentData = getParentNodeData(props.id) ?? props.parentData ?? {};
  const { separateLineColor, separateLineAlpha } = parentData;
  const iconSource = parentData?.imageCloud?.source;
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;

  if (!data) return null;
  const size = data.size;
  const weatherMainStyle = getTextStyle(props.parentId, data.weatherMain);
  const weatherSubStyle = getTextStyle(props.parentId, data.weatherSub);
  const renderHourlyIcon = () =>
    iconSource
      ? <img src={iconSource} alt="" style={hourlyIconStyle} />
      : <div style={hourlyIconPlaceholderStyle}></div>;
  const renderDaysIcon = () =>
    iconSource
      ? <img src={iconSource} alt="" style={daysIconStyle} />
      : <div style={daysIconPlaceholderStyle}></div>;

  return (
    <div
      className={`size_${data?.size}`}
      style={{
        ...getContainerStyle(data.radius, isCropEditingNode ? 'visible' : 'hidden'),
        transform: `scale(${scale}, ${scale})`,
        transformOrigin: '0 0',
      }}
    >
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
      { size === 1 && (
        <div style={contentStyle}>
          <div style={headerRowStyle}>
            {localicon} Berkely
          </div>
          <div style={getMainRowStyle(data.weatherMain.textSize, 10)}>
            { iconSource
              ? <img src={iconSource} alt="" style={weatherIconStyle} />
              : <div style={weatherIconPlaceholderStyle}></div>
            }
            <span style={weatherMainStyle}>36°</span>
          </div>
          <div style={subRowStyle}>
            <span style={weatherSubStyle}>Clouds</span>
          </div>
          <div style={baseRowStyle}>
            <span style={weatherSubStyle}>38/30°</span>
          </div>
        </div>
      ) }
      { size === 2 && (
        <div style={contentStyle}>
          <div style={headerRowStyle}>
            {localicon} Berkely
          </div>
          <div style={getMainRowStyle(data.weatherMain.textSize, 10)}>
            { iconSource
              ? <img src={iconSource} alt="" style={weatherIconStyle} />
              : <div style={weatherIconPlaceholderStyle}></div>
            }
            <span style={{ ...weatherMainStyle, marginRight: 10 }}>36°</span>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={weatherSubStyle}>Clouds</span>
              <span style={weatherSubStyle}>38/30°</span>
            </div>
          </div>
          <div style={getHourlyRowStyle(0)}>
            {hours.map((hour) => (
              <div key={hour} style={getColumnStyle(props.parentId, data.weatherSub)}>
                <span>{hour}</span>
                {renderHourlyIcon()}
                <span>23°</span>
              </div>
            ))}
          </div>
        </div>
      ) }
      { size === 3 && (
        <div style={contentStyle}>
          <div style={headerRowStyle}>
            {localicon} Berkely
          </div>
          <div style={getMainRowStyle(data.weatherMain.textSize, 18)}>
            { iconSource
              ? <img src={iconSource} alt="" style={weatherIconStyle} />
              : <div style={weatherIconPlaceholderStyle}></div>
            }
            <span style={{ ...weatherMainStyle, marginRight: 10 }}>36°</span>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={weatherSubStyle}>Clouds</span>
              <span style={weatherSubStyle}>38/30°</span>
            </div>
          </div>
          <div style={getDividerStyle(separateLineColor, separateLineAlpha)}></div>
          <div style={getHourlyRowStyle(18)}>
            {hours.map((hour) => (
              <div key={hour} style={getColumnStyle(props.parentId, data.weatherSub)}>
                <span>{hour}</span>
                {renderHourlyIcon()}
                <span>23°</span>
              </div>
            ))}
          </div>
          <div style={getDividerStyle(separateLineColor, separateLineAlpha)}></div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              alignItems: 'center',
              ...weatherSubStyle,
            }}
          >
            {days.map((day: any) => {
              return (
                <div key={day} style={daysRowStyle}>
                  <div style={daysLabelStyle}>
                    {day}
                  </div>
                  <div style={daysWeatherStyle}>
                    {renderDaysIcon()}
                    <span>Clouds</span>
                  </div>
                  <span>
                    38°-30°
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) }
    </div>
  );
}