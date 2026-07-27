import ThemeIpadHomePreview from './ThemeIpadHomePreview';

export default function PreviewLongIpad(props: any) {
  return (
    <ThemeIpadHomePreview
      data={props.data}
      defaultWidth={2048}
      defaultHeight={2732}
      cols={4}
      rows={4}
      nodeId={props.id}
    />
  );
}
