import CropEditableImage from '../components/CropEditableImage';
import {
  useEditorCropEditingNodeId,
  useEditorCropToolOpen,
  // useEditorGetParentNodeData,
  // type CropProps,
} from '../context';

import './style.css';

export default function QuotationLayout_0(props: any) {
  const cropToolOpen = useEditorCropToolOpen();
  const cropEditingNodeId = useEditorCropEditingNodeId();
  const isCropEditingNode = cropToolOpen && cropEditingNodeId === props.id;
  const data = props.data;

  if (!data) return null;
//   "quote":{
//     "content":"The\nunexpected\nencounter of a\nhit is a\nsurprise in\nyour efforts .",
//     "textAlignment":1,
//     "font":"AvenirNext-HeavyItalic",
//     "textSize":16,
//     "textColor":"#FFFFFF"
// }
  const paddingSize:any = {
    1: 18,
    2: 20,
    3: 24,
  }
  return (
    <div
      className={`size_${data?.size ?? 1}`}
      style={{
        backgroundColor: '#ffffff',
        overflow: isCropEditingNode ? 'visible' : 'hidden',
        borderRadius: `${data.radius ?? 0}px`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `0 ${paddingSize[data?.size]}px`
      }}
    >
      <CropEditableImage
        nodeId={props.id}
        source={data.source}
        radius={data.radius}
        cropProps={data.crop_props}
      />
      <div style={{
        position: 'relative',
        zIndex: 2,
        fontFamily: data.quote.font,
        fontSize: data.quote.textSize,
        color: data.quote.textColor,
        textAlign: (data.quote.textAlignment === 1 ? 'left' : (data.quote.textAlignment === 2) ? 'center' : 'right'),
      }}>
        { data.quote.content }
      </div>
    </div>
  );
}
