import ThemeHomePreview from './ThemeHomePreview';

export default function PreviewShort(props: any) {
  return (
    <ThemeHomePreview
      data={props.data}
      defaultWidth={887}
      defaultHeight={1578}
      cols={4}
      rows={5}
    />
  );
}
