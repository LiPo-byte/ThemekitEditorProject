// import CropEditableImage from '../components/CropEditableImage';
// import {
//     useEditorCropEditingNodeId,
//     useEditorCropToolOpen,
//   } from '../context';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

  export default function lottieWallpaper(props: any) {
    const data = props.data;
    const scale = typeof props.scale === 'number' ? props.scale : 1;

    if (!data) return null;
    // http://localhost:5173/data/project/c4e21220-0e35-416b-8075-4f560730c2a9/Character%20Run%20Cycle.lottie
    // const { width, height } = data.diy_live_wallpaper;
    const width = Number(data.width) > 0 ? Number(data.width) : 887;
    const height = Number(data.height) > 0 ? Number(data.height) : 1920;
    return (
      <div
        style={{
          transform: `scale(${scale}, ${scale})`,
          transformOrigin: '0 0',
          width,
          height,
          backgroundColor: '#ffffff',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
          <DotLottieReact
            src={data.lottieSource}
            autoplay
            loop
            style={{ width: '100%', height: '100%' }}
          />
      </div>
    );
  }
  